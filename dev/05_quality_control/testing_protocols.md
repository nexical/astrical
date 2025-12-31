# Protocol: Testing & Validation

**Status:** Active Protocol
**Scope:** `test/`, `src/utils/`, `src/form-handlers/`
**Tools:** Vitest (Unit), Playwright (E2E), Zod (Data Integrity)

## 1. The Core Philosophy: "Test the Logic, Not the Framework"

Astrical relies heavily on Astro and Cloudflare, which are already tested by their respective teams. Our testing strategy focuses on **YOUR** logic:
1.  **Business Logic:** (e.g., "Does the Cart total calculate correctly?")
2.  **Data Integrity:** (e.g., "Does the YAML content match the schema?")
3.  **Critical Paths:** (e.g., "Does the Contact Form actually send data?")

**The Rule:**
> "Every Utility and Form Handler MUST have a Unit Test. Every Critical User Flow MUST have an E2E Test."

---

## 2. Tier 1: Data Integrity (The "Static" Guard)

Before running any code, we verify the data. Since Astrical is "Content-Driven," a typo in a YAML file is a critical bug.

### A. Content Validation
**Command:** `npm run validate:content`
**Logic:** Scans every `.yaml` file in `content/` and validates it against `src/types/*.ts` schemas (Zod).

* **When to run:** After every content edit.
* **What it catches:** Missing titles, invalid dates, broken references.

### B. Theme Validation
**Command:** `npm run validate:themes`
**Logic:** Ensures that `content/style.yaml` only uses allowed keys and valid token structures.

---

## 3. Tier 2: Unit Testing (The "Logic" Guard)

We use **Vitest** for fast, headless testing of functions, services, and classes.

* **Location:** `test/unit/`
* **Naming Convention:** `[filename].test.ts`
* **Mocking:** We verify logic in isolation by mocking external dependencies (like the Database or `window`).

### Recipe A: Testing a Utility (Service Pattern)
*Target: `src/utils/pricing.ts`*

```typescript
// src/utils/pricing.ts
export const calculateTotal = (price: number, tax: number) => price * (1 + tax);

// test/unit/utils/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '~/utils/pricing';

describe('Pricing Utility', () => {
  it('should calculate tax correctly', () => {
    const result = calculateTotal(100, 0.2);
    expect(result).toBe(120);
  });

  it('should handle zero tax', () => {
    expect(calculateTotal(50, 0)).toBe(50);
  });
});

```

### Recipe B: Testing a Form Handler (Mocking Context)

*Target: `src/form-handlers/db-save.ts*`

This is critical. We don't want to actually write to the production database during tests. We **mock** the `db` utility.

```typescript
// test/unit/handlers/db-save.test.ts
import { describe, it, expect, vi } from 'vitest';
import { DbSaveHandler } from '~/form-handlers/db-save';

describe('DbSaveHandler', () => {
  it('should insert data into D1', async () => {
    // 1. Setup the Mock DB
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn();
    
    // Intercept the import of getDb
    vi.mock('~/utils/db', () => ({
      getDb: () => ({
        insert: mockInsert,
        values: mockValues
      })
    }));

    // 2. Run the Handler
    const handler = new DbSaveHandler();
    const context = { runtime: { env: {} } }; // Fake context
    
    await handler.handle('contact', { email: 'test@test.com' }, [], context);

    // 3. Assertions
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
      email: 'test@test.com'
    }));
  });
});

```

---

## 4. Tier 3: E2E Testing (The "Reality" Guard)

We use **Playwright** to test the actual rendered HTML in a browser engine. This verifies that the API routes, Islands, and styling work together.

* **Location:** `test/e2e/`
* **Command:** `npm run test:e2e`

### Recipe: The Critical Path (Form Submission)

Does the user actually see a success message when they click "Submit"?

```typescript
// test/e2e/contact.spec.ts
import { test, expect } from '@playwright/test';

test('Contact Form Submission Flow', async ({ page }) => {
  // 1. Go to page
  await page.goto('/contact');

  // 2. Fill Form
  await page.getByLabel('Full Name').fill('Test Bot');
  await page.getByLabel('Email').fill('bot@test.com');
  await page.getByLabel('Message').fill('Hello World');

  // 3. Click Submit
  await page.getByRole('button', { name: 'Send Message' }).click();

  // 4. Verify Success UI (Wait for hydration/API response)
  await expect(page.getByText('Message sent successfully')).toBeVisible();
});

```

---

## 5. Testing Anti-Patterns

| Bad Practice | Why it fails | Correct Approach |
| --- | --- | --- |
| **Testing Astro Components via Unit Tests** | Astro components compile to HTML strings. Unit testing them is messy and fragile. | Use E2E (Playwright) to verify the output HTML. |
| **Testing 3rd Party Libraries** | Writing a test to prove that `zod.parse()` works. | Trust the library. Test *your* schema definition instead. |
| **Connecting to Real DBs** | Running tests against your prod D1 database. | Use Mocks (`vi.mock`) or a local SQLite file for integration tests. |
| **Ignoring the Build** | "Tests pass but deployment failed." | Always run `npm run build` as the final test check. |

---

## 6. The "Agent's Oath" (Verification Loop)

Before marking a task as "Complete," the Agent must execute this sequence:

1. **Lint:** `npm run lint` (Catch syntax errors).
2. **Validate:** `npm run validate:content` (Catch schema errors).
3. **Unit Test:** `npm run test:unit` (Verify the new logic).
4. **E2E Test:** `npm run test:e2e` (Verify the UI).
5. **Build:** `npm run build` (Final integration check).

*If any step fails, the task is **NOT** complete.*
