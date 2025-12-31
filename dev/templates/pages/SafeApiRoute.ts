/**
 * core/dev/templates/pages/SafeApiRoute.ts
 *
 * ==============================================================================
 * 🛡️ THE SAFE API ROUTE WRAPPER
 * ==============================================================================
 *
 * A higher-order helper to reduce boilerplate in API Routes.
 * It enforces the "Validate -> Act -> Respond" pattern automatically.
 *
 * FEATURES:
 * 1. Automatic Zod Validation (Returns 400 if schema fails).
 * 2. Automatic Error Catching (Returns 500 if logic crashes).
 * 3. Type Inference (The handler receives typed data).
 * 4. Standardized JSON format { success, data, error }.
 *
 * USAGE:
 *
 * export const POST = createSafeRoute(
 * z.object({ email: z.string().email() }),
 * async (data, context) => {
 * await subscribeUser(data.email);
 * return { message: "Subscribed!" };
 * }
 * );
 */

import type { APIRoute, APIContext } from 'astro';
import { z, type ZodSchema } from 'zod';

// --- Standard Response Shape ---
type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    details?: any; // Validation errors
};

/**
 * Creates a type-safe API route handler.
 *
 * @param schema - A Zod schema to validate the request body.
 * @param handler - The business logic function. Receives validated data and Astro context.
 */
export function createSafeRoute<T extends ZodSchema>(
    schema: T,
    handler: (
        validatedData: z.infer<T>,
        context: APIContext
    ) => Promise<any>
): APIRoute {

    return async (context) => {
        const { request } = context;

        try {
            // 1. PARSE & VALIDATE
            // We assume JSON body for this wrapper.
            // For FormData, you might need a separate 'createSafeFormRoute' helper.
            let rawBody;
            try {
                rawBody = await request.json();
            } catch (e) {
                return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
            }

            const validation = schema.safeParse(rawBody);

            if (!validation.success) {
                return jsonResponse(
                    {
                        success: false,
                        error: 'Validation Failed',
                        details: validation.error.flatten(),
                    },
                    400
                );
            }

            // 2. EXECUTE HANDLER
            // The handler returns data which we automatically wrap in { success: true, data: ... }
            const result = await handler(validation.data, context);

            // Support handler returning a full object or just the data
            if (result && typeof result === 'object' && 'success' in result) {
                // If the handler returned a structured response manually, pass it through
                return jsonResponse(result, 200);
            }

            return jsonResponse({ success: true, data: result }, 200);

        } catch (error: any) {
            // 3. CATCH & LOG
            console.error(`[SafeApiRoute] Critical Error: ${error.message}`, error);

            // In production, generic message. In dev, specific message.
            const isDev = import.meta.env.DEV;

            return jsonResponse(
                {
                    success: false,
                    error: isDev ? error.message : 'Internal Server Error',
                },
                500
            );
        }
    };
}

/**
 * Helper to construct the Response object with standard headers.
 */
function jsonResponse(body: ApiResponse<any>, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
