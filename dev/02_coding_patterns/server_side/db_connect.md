# Protocol: Database Connections (D1 & Drizzle)

**Status:** Active Protocol
**Scope:** `src/utils/db.ts`, `src/db/*`
**Key Systems:** Cloudflare D1, Drizzle ORM

## 1. The Core Philosophy: "Edge-First Persistence"

Astrical runs on the Edge (Cloudflare Workers). This means:
* **No Long-Lived Connections:** You cannot open a TCP socket and keep it open (like standard Postgres).
* **Serverless SQLite:** We primarily use Cloudflare D1, which communicates over HTTP/RPC bindings.
* **Type Safety:** We strongly enforce using an ORM (Drizzle) to prevent runtime SQL errors.



**The Rule:**
> "Never write raw SQL strings inside a Component or API Route. Always use the Data Access Layer (DAL) located in `src/utils/db.ts` or specific Service classes."

---

## 2. Setup & Configuration

Database access relies on **Bindings**. The environment provides the connection, not a connection string in a `.env` file.

### A. Define the Binding (`wrangler.toml`)
Ensure your D1 database is bound to the worker.

```toml
[[d1_databases]]
binding = "DB" # The variable name available in Astro.locals.runtime.env
database_name = "astrical-prod"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

```

### B. Type the Binding (`src/env.d.ts`)

Tell TypeScript that `DB` exists on the generic `Env` interface.

```typescript
type D1Database = import('@cloudflare/workers-types').D1Database;

interface Env {
  DB: D1Database;
}

```

---

## 3. The "Singleton Client" Pattern

We do not initialize a new DB client on every line of code. We use a centralized utility to hydrate the ORM client using the current request's environment context.

**File:** `src/utils/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema'; // Your centralized schema definition

/**
 * Standard accessor for the Database.
 * Requires the 'env' object passed from the API context or Middleware.
 */
export function getDb(env: Env) {
  if (!env.DB) {
    throw new Error('❌ Database binding (DB) not found in environment.');
  }
  
  // Drizzle is lightweight enough to initialize per-request on the Edge
  return drizzle(env.DB, { schema });
}

```

---

## 4. Defining the Schema (Drizzle ORM)

We define our data structure in TypeScript, which becomes the source of truth for both the database tables and the types used in the app.

**File:** `src/db/schema.ts`

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Define the Table
export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  formName: text('form_name').notNull(),
  email: text('email'),
  payload: text('payload').notNull(), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 2. Export Types for use in UI/API
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

```

---

## 5. Usage Recipes

### Recipe A: Writing to DB (Inside a Form Handler)

This creates a clean separation: The Handler receives the logic, but uses the Schema to ensure data integrity.

```typescript
// src/form-handlers/db-save.ts
import type { FormHandler } from '~/types';
import { getDb } from '~/utils/db';
import { submissions } from '~/db/schema';

export class DbSaveHandler implements FormHandler {
  name = 'save-to-db';
  description = 'Persists submission to D1';

  async handle(formName: string, data: Record<string, any>, context: any) {
    // 1. Get DB Client from Context
    // context.env is injected by Astro middleware
    const db = getDb(context.env);

    // 2. Execute Insert
    await db.insert(submissions).values({
      formName,
      email: data.email as string,
      payload: JSON.stringify(data),
    });
    
    console.log(`Saved submission for ${formName}`);
  }
}

```

### Recipe B: Reading from DB (Inside an API Route)

Used for fetching data to populate a dashboard or island.

```typescript
// src/pages/api/submissions.ts
import type { APIRoute } from 'astro';
import { getDb } from '~/utils/db';
import { submissions } from '~/db/schema';
import { desc } from 'drizzle-orm';

export const GET: APIRoute = async ({ locals }) => {
  const db = getDb(locals.runtime.env);

  // Type-safe query builder
  const results = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt))
    .limit(50);

  return new Response(JSON.stringify(results), { status: 200 });
};

```

---

## 6. Migrations (Schema Management)

D1 does not allow ad-hoc schema changes. You must generate and apply migrations.

### Step 1: Generate Migration

Run this when you change `src/db/schema.ts`.

```bash
npx drizzle-kit generate:sqlite

```

*This creates a SQL file in `drizzle/migrations/`.*

### Step 2: Apply to Local Dev

```bash
npx wrangler d1 migrations apply astrical-prod --local

```

### Step 3: Apply to Production

```bash
npx wrangler d1 migrations apply astrical-prod --remote

```

---

## 7. Security & Best Practices

1. **Never Expose the DB Object:** Do not pass the `db` instance to the client-side. It is for Server/API routes only.
2. **Use Prepared Statements:** Drizzle handles this automatically. If you must use raw SQL (via `db.run()`), always use binding parameters `?` to prevent SQL Injection.
3. **Environment Separation:**
* **Dev:** Uses `.wrangler/state/v3/d1` (Local SQLite file).
* **Prod:** Uses Cloudflare's distributed D1 instances.
* *Tip:* Do not commit your `.sqlite` files to Git.



## 8. Troubleshooting

* **Error: `No binding found for DB**`
* *Fix:* Check `wrangler.toml` to ensure `[[d1_databases]]` is configured correctly and matches the variable name in `src/env.d.ts`.


* **Error: `Table not found**`
* *Fix:* You likely forgot to run the migration command (`npx wrangler d1 migrations apply ...`).
