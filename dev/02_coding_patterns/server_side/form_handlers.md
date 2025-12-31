# Protocol: Form Handlers (The Registry Pattern)

**Status:** Active Protocol
**Scope:** `src/form-handlers/*.ts`, `modules/*/src/form-handlers/*.ts`
**Key Systems:** Form Registry, `submit-form` API

## 1. The Core Philosophy: "Effectors, not Validators"

In the Astrical architecture, the API Route (`api/submit-form`) is the **Gatekeeper**. It handles validation, security (Honeypot), and parsing.

The Form Handlers are the **Effectors**. They are plugins that execute specific side effects after the gatekeeper opens the door.

* **API Route Responsibilities:** Validation (`zod`), Spam Check, Rate Limiting.
* **Form Handler Responsibilities:** Sending Emails, Saving to Database, Pinging Slack, Updating CRM.



**The Rule:**
> "Never hard-code an integration (like 'SendGrid') directly into the API route. Create a dedicated Handler class and register it."

---

## 2. The Interface Contract

Every handler must implement the strict `FormHandler` interface defined in `src/types/form.ts`. This ensures the Registry can load and execute it reliably.

```typescript
// src/types/form.ts (Reference)
export interface FormHandler {
  /**
   * Unique identifier used in config.yaml (e.g., 'mailgun', 'save-db')
   */
  name: string;

  /**
   * Human-readable description for debugging/admin
   */
  description?: string;

  /**
   * The execution logic
   * @param formName - The key from config.yaml (e.g., 'contact-us')
   * @param data - The raw key-value pairs from the form
   * @param attachments - Any file uploads (processed buffer)
   * @param context - The Astro Locals (contains DB bindings, Env vars)
   */
  handle(
    formName: string,
    data: Record<string, any>,
    attachments: { filename: string; data: Uint8Array }[],
    context: App.Locals
  ): Promise<void>;
}

```

---

## 3. The Registry Mechanics (Auto-Discovery)

Astrical uses **Auto-Discovery** to find handlers. You do not need to manually import them into a central array.

**How it works:**

1. **File Placement:** The system scans `src/form-handlers/*.ts` and `modules/*/src/form-handlers/*.ts`.
2. **Registration:** It instantiates the class found in the file.
3. **Lookup:** It maps the `name` property to the instance.

*Note: If two handlers claim the same `name`, the system will throw a startup error to prevent ambiguity.*

---

## 4. Implementation Recipes

### Recipe A: The "Database Saver" (Internal Resource)

*Persists the submission to Cloudflare D1.*

```typescript
// src/form-handlers/db-save.ts
import type { FormHandler } from '~/types';
import { getDb } from '~/utils/db';
import { submissions } from '~/db/schema';

export class DbSaveHandler implements FormHandler {
  name = 'save-to-db'; // <--- Referenced in config.yaml
  description = 'Persists submission to D1 SQLite database';

  async handle(formName: string, data: Record<string, any>, _files: any, context: any) {
    // 1. Get DB Connection from Context
    const db = getDb(context.runtime.env);

    // 2. Perform Write
    await db.insert(submissions).values({
      formName,
      payload: JSON.stringify(data),
      createdAt: new Date()
    });
    
    console.log(`[DB] Saved submission for ${formName}`);
  }
}

```

### Recipe B: The "Webhook Dispatcher" (External Integration)

*Sends data to Zapier, Slack, or a Marketing CRM.*

```typescript
// src/form-handlers/webhook.ts
import type { FormHandler } from '~/types';

export class WebhookHandler implements FormHandler {
  name = 'zapier-dispatch';
  
  async handle(_formName: string, data: Record<string, any>, _files: any, context: any) {
    const webhookUrl = context.runtime.env.ZAPIER_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.warn('Skipping Webhook: No URL configured in ENV');
      return;
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
}

```

---

## 5. Wiring it Up (Configuration)

Once a handler is created (e.g., `save-to-db`), you must tell the Form System **when** to use it. This is done in the "User Space" configuration.

**File:** `content/config.yaml`

```yaml
# content/config.yaml
forms:
  # The Form ID used in the UI: <Form widget id="contact" />
  contact:
    handlers:
      - save-to-db       # Runs first
      - mailgun-email    # Runs second (if configured)
      - zapier-dispatch  # Runs third

  newsletter:
    handlers:
      - mailchimp-sync   # Different handlers for different forms

```

**The Execution Flow:**
When a user submits the "contact" form:

1. The API Route looks up `forms.contact` in config.
2. It iterates through the `handlers` list (`['save-to-db', 'mailgun-email']`).
3. It calls `handle()` on each one sequentially.
4. *Error Handling:* If one handler fails (throws), the API captures the error but tries to finish the others (unless it's a critical failure).

---

## 6. Testing & Debugging

Because Handlers are just Classes, they are easy to unit test.

**Unit Test Example (`test/unit/handlers/db-save.test.ts`):**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { DbSaveHandler } from '~/form-handlers/db-save';

describe('DbSaveHandler', () => {
  it('should insert data into D1', async () => {
    // Mock the DB context
    const mockDb = { insert: vi.fn().mockReturnThis(), values: vi.fn() };
    const context = { runtime: { env: { DB: {} } } };
    
    // Inject Mock
    vi.mock('~/utils/db', () => ({ getDb: () => mockDb }));

    const handler = new DbSaveHandler();
    await handler.handle('test-form', { email: 'test@example.com' }, [], context);

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@example.com'
    }));
  });
});

```

## 7. Troubleshooting

* **Error: `Handler [xyz] not found**`
* *Cause:* You listed `xyz` in `config.yaml`, but no class in `src/form-handlers/` has `name = 'xyz'`.
* *Fix:* Check the `name` property of your class.


* **Error: Handler not running**
* *Cause:* The form ID in the HTML (`<Form id="contact" />`) does not match the key in `config.yaml` (`forms: contact:`).


* **Environment Variables Missing**
* *Cause:* Handlers run in the Worker context. Ensure variables are in `.dev.vars` (local) or added via `wrangler secret put` (production).
