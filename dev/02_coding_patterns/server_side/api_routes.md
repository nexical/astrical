# Protocol: Server-Side API Routes

**Status:** Active Protocol
**Scope:** `src/pages/api/**/*.ts`
**Key Systems:** Astro Endpoints, Zod Validation, ResponseFactory

## 1. The Core Philosophy: "Controllers, not Services"

In Astrical, an API Route (a `.ts` file in `src/pages/api/`) acts strictly as a **Controller**.

* **It DOES:** Parse inputs, validate schemas, check permissions (Guards), and return standardized HTTP responses.
* **It DOES NOT:** Send emails, write to databases, or calculate taxes. It delegates these tasks to **Services** (Utilities) or **Form Handlers**.

**The Golden Rule:**
> "If your API route file is longer than 50 lines, you are likely leaking business logic into the Controller. Move the logic to `src/utils/`."

---

## 2. The "Secure Controller" Pattern

Every API route must follow this 4-step execution flow to ensure security and consistency.

1.  **Validate:** Ensure inputs match a strict Zod schema.
2.  **Guard:** Check security (Honeypot, Rate Limiting, Authentication).
3.  **Act:** Call a Service or Form Handler to perform the work.
4.  **Respond:** Return a standardized JSON response using `ResponseFactory`.

---

## 3. Standard Implementation Recipes

We provide a standard response helper to ensure all API responses have the same shape (`success`, `message`, `data`, `errors`).

### A. The "Simple GET" (Data Fetching)
Use this for fetching JSON data for client-side Islands.

```typescript
// src/pages/api/status.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  // 1. Act (Get data from a Service)
  const systemStatus = {
    version: '1.0.0',
    maintenance: false,
    timestamp: new Date().toISOString()
  };

  // 2. Respond
  return new Response(JSON.stringify(systemStatus), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

```

### B. The "Secure POST" (Form Submission)

This is the standard pattern for handling user input (Contact Forms, Newsletter Signups).

**Key Security Feature: The Honeypot**
We check a hidden form field (usually named `_gotcha` or similar). If it has a value, a bot filled it out. We reject the request silently or with a generic success to confuse the bot.

```typescript
// src/pages/api/submit-form.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getFormHandler } from '~/form-registry'; // The Registry Pattern

// 1. Define Schema
const SubmissionSchema = z.object({
  form_name: z.string(),
  payload: z.record(z.any()),
  _gotcha: z.string().optional(), // Honeypot field
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // A. Parse Body
    const formData = await request.json();
    
    // B. Validate Inputs
    const result = SubmissionSchema.safeParse(formData);
    if (!result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid Input', 
        details: result.error.flatten() 
      }), { status: 400 });
    }

    const { form_name, payload, _gotcha } = result.data;

    // C. Guard: Honeypot Check
    if (_gotcha) {
      // Return fake success to fool bots
      return new Response(JSON.stringify({ success: true, message: 'Received' }), { status: 200 });
    }

    // D. Act: Delegate to Handler Registry
    const handler = await getFormHandler(form_name);
    if (!handler) {
      return new Response(JSON.stringify({ success: false, error: `No handler for ${form_name}` }), { status: 404 });
    }

    await handler.handle(form_name, payload);

    // E. Respond
    return new Response(JSON.stringify({ success: true, message: 'Form processed successfully' }), { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { status: 500 });
  }
};

```

---

## 4. The `SafeApiRoute` Template

To avoid rewriting the try/catch/validate boilerplate, use the `SafeApiRoute` wrapper.
*(See `dev/templates/pages/SafeApiRoute.ts` for the implementation)*.

**Usage:**

```typescript
import { createSafeRoute } from '~/utils/api-safe-wrapper';
import { z } from 'zod';

const Schema = z.object({ email: z.string().email() });

export const POST = createSafeRoute(Schema, async (validatedData, context) => {
  // This code only runs if validation passes.
  // Errors are automatically caught and formatted.
  
  await NewsletterService.subscribe(validatedData.email);
  
  return { success: true, message: "Subscribed!" };
});

```

---

## 5. Security Checklist

Before deploying an API route, verify:

1. **Validation:** Is every input field validated with `zod`?
2. **Sanitization:** Are you stripping HTML from text inputs to prevent XSS?
3. **CSRF:** For sensitive actions, are you checking the `Origin` header?
4. **Honeypot:** Is the `_gotcha` check implemented for public forms?
5. **Rate Limiting:** (Advanced) Is this route behind Cloudflare or a middleware limiter?

---

## 6. Client-Side Consumption

How to call these routes from an Island (`.tsx`).

```typescript
// Example: submitting data from a React form
async function handleSubmit(data) {
  const response = await fetch('/api/submit-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      form_name: 'contact',
      payload: data,
      _gotcha: '' // Leave empty
    })
  });

  const result = await response.json();
  if (!result.success) {
    console.error(result.error);
    alert('Submission failed');
  } else {
    alert('Success!');
  }
}

```
