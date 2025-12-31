/**
 * core/dev/templates/logic/GenericGuard.ts
 *
 * ==============================================================================
 * 🛡️ THE GENERIC GUARD TEMPLATE
 * ==============================================================================
 *
 * A "Guard" is a self-contained unit of logic responsible for protecting a resource.
 * It answers one question: "Is this request allowed to proceed?"
 *
 * USE CASES:
 * - Authentication (Is the user logged in?)
 * - Authorization (Does the user have the 'admin' role?)
 * - Rate Limiting (Has this IP sent too many requests?)
 * - Feature Flags (Is this beta feature enabled?)
 * - Honeypot Detection (Is this a bot?)
 *
 * ARCHITECTURAL ROLE:
 * Guards sit between the Router and the Business Logic (Controller/Handler).
 * They decouple validation rules from the actual task execution.
 *
 * USAGE:
 * Copy this file to `src/guards/YourNewGuard.ts` and implement the `validate` method.
 */

import type { APIContext } from 'astro';

// --- Types ---

export interface GuardResult {
    /**
     * Allowed to proceed?
     */
    allowed: boolean;

    /**
     * If denied, provide a reason (for logging or UI feedback).
     */
    reason?: string;

    /**
     * Optional: HTTP Status code to return if denied (e.g., 401, 403, 429).
     * Defaults to 403.
     */
    status?: number;
}

/**
 * Abstract Base Class for all Guards.
 * Enforces a consistent interface for the Guard Registry.
 */
export abstract class GenericGuard {
    /**
     * A unique identifier for logging and debugging.
     * e.g., 'auth-guard', 'rate-limit'
     */
    abstract readonly name: string;

    /**
     * The core logic.
     * @param context - The standard Astro API Context (contains request, locals, url, etc.)
     * @returns Promise<GuardResult>
     */
    abstract validate(context: APIContext): Promise<GuardResult>;

    /**
     * Helper to generate a standardized "Success" result.
     */
    protected pass(): GuardResult {
        return { allowed: true };
    }

    /**
     * Helper to generate a standardized "Fail" result.
     */
    protected fail(reason: string, status: number = 403): GuardResult {
        return { allowed: false, reason, status };
    }
}

// ==============================================================================
// 📝 EXAMPLE IMPLEMENTATION
// ==============================================================================

/**
 * Example: A Guard that checks if a specific header is present (e.g., API Key).
 * * Usage in API Route:
 * const guard = new ApiKeyGuard();
 * const result = await guard.validate(context);
 * if (!result.allowed) return new Response(result.reason, { status: result.status });
 */
export class ExampleApiKeyGuard extends GenericGuard {
    readonly name = 'example-api-key';

    async validate({ request }: APIContext): Promise<GuardResult> {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return this.fail('Missing Authorization header', 401);
        }

        if (!authHeader.startsWith('Bearer ')) {
            return this.fail('Invalid Authorization format. Expected "Bearer <token>"', 400);
        }

        // In a real app, you would validate this token against a Service
        const token = authHeader.split(' ')[1];
        if (token !== 'secret-123') {
            return this.fail('Invalid API Token', 403);
        }

        return this.pass();
    }
}

/**
 * Example: A Guard that checks user roles via Astro Locals (Lucia Auth).
 */
export class ExampleRoleGuard extends GenericGuard {
    readonly name = 'role-guard';
    private requiredRole: string;

    constructor(role: string) {
        super();
        this.requiredRole = role;
    }

    async validate({ locals }: APIContext): Promise<GuardResult> {
        // Check if user is authenticated using the App.Locals structure
        if (!locals.auth || !locals.auth.user) {
            return this.fail('Unauthorized', 401);
        }

        // Use the built-in helper to check for the required role
        if (!locals.auth.hasRole([this.requiredRole])) {
            return this.fail(`Forbidden: Requires ${this.requiredRole} role`, 403);
        }

        return this.pass();
    }
}
