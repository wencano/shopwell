# ShopWell — Next.js app (Supabase + Drizzle + Stripe)

## Setup

1. Create a Supabase project. Enable **Email** auth (password).
2. Copy **Project URL**, **publishable** key (`sb_publishable_...`), and **secret** key (`sb_secret_...`) from **Settings → API Keys** (legacy **anon** / **service_role** JWTs still work via the fallbacks in code).
3. In Supabase SQL editor, run the schema migration:
   - `web/drizzle/0000_init.sql`  
   Then lock the **Data API** to your app server (see **Security** below):
   - `web/drizzle/0001_enable_rls_public_tables.sql`
4. Set environment variables (see `.env.example`).

### Vercel performance (Postgres)

Use Supabase **connection pooling** for `DATABASE_URL` in production (Dashboard → **Connect** → **Transaction pooler**, URI on port **6543**). Append `?pgbouncer=true` if the host is the pooler. Direct connections (5432) from many serverless invocations exhaust Postgres and add latency.

Optional: `DATABASE_POOL_MAX` (default `4`) caps connections per warm lambda.

### Rate limiting (Vercel / abuse)

Middleware enforces **per-IP** limits using **Upstash Redis** (works across all Edge instances; in-memory in middleware would not).

Set in Vercel project env (create a database at [upstash.com](https://upstash.com) → REST API):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If either is missing, limiting is **skipped** (useful locally). Default: **200 requests / minute / IP** (sliding window). Override with `RATE_LIMIT_PER_MINUTE`.

Static assets in `/_next/static` and images are excluded by the middleware matcher and do not count.

5. From `web/`:

```bash
npm install
npm run seed   # creates auth users + loads ../seed/shopwell.seed.json
npm run dev
```

Demo login (after seed): emails from `seed/shopwell.seed.json`, password default `ShopwellDemo2026!` or `SEED_USER_PASSWORD`.

## Security (Supabase Data API)

Tables live in the **`public`** schema, so PostgREST exposes them to anyone with your **publishable** key **unless** Row Level Security stops it.

This app reads and writes data with **Drizzle + `DATABASE_URL`** (Postgres role bypasses RLS). The browser Supabase client is only used for **Auth** (`auth` schema), not `public` tables.

Run **`web/drizzle/0001_enable_rls_public_tables.sql`** after `0000_init`. That turns on **RLS** on every app table with **no policies**, so `anon` / `authenticated` get **no rows** via the REST API. Your Next.js server keeps working.

Later, if you want some data readable from the client (e.g. `products`), add explicit `CREATE POLICY` statements for `authenticated` or `anon` on those tables only.

## Scripts

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm start` — production
- `npm run db:push` — Drizzle push (dev only; or apply SQL migration manually)
- `npm run seed` — Auth + DB seed (needs `SUPABASE_SECRET_KEY` or legacy service role + `DATABASE_URL`)
- `npm run test` — Vitest
- `npm run test:e2e` — Playwright (requires dev server)

## Stripe

- Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional on server-only checkout), `STRIPE_WEBHOOK_SECRET`
- Webhook endpoint: `POST /api/webhooks/stripe` — `checkout.session.completed`
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://yourdomain.com` for success/cancel URLs

## Project layout

- `src/app` — App Router (storefront, account, seller, admin, webhooks)
- `src/db` — Drizzle schema + client
- `src/lib` — Supabase clients, queries, formatting
- `scripts/seed.ts` — imports root `../seed/shopwell.seed.json`

## Notes

- **RLS**: after applying `0001_enable_rls_public_tables.sql`, `public` tables are hidden from PostgREST; app data still flows through server-side Drizzle.
- **contentgen/** at repo root is optional / legacy; the app uses manual JSON seed only.
