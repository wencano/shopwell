# ShopWell

Multivendor-ready wellness marketplace (AU-focused: **AUD**, compliance-oriented copy). This repo holds the **Next.js** app under `web/`, JSON seed data, and architecture notes.

For local setup, environment variables, Stripe webhooks, and security notes about Supabase RLS, see **[web/README.md](web/README.md)**. The longer design target is in **[architecture.md](architecture.md)**.

## Repository layout

| Path | Purpose |
|------|---------|
| `web/` | Next.js 15 (App Router), Drizzle, Supabase Auth, Stripe Checkout |
| `seed/` | `shopwell.seed.json` and validation helpers for `npm run seed` |
| `architecture.md` | Product/technical architecture (actors, domain, phased payments) |

## System flow

How the main pieces connect at runtime:

```mermaid
flowchart LR
  subgraph Clients
    B[Buyer]
    S[Seller]
    A[Admin]
  end
  subgraph App["Next.js app"]
    MW[Middleware]
    Pages[Pages]
    API[Webhooks]
  end
  subgraph External
    SBAuth["Supabase Auth"]
    PG[("Postgres")]
    Pay[Stripe]
  end
  B --> App
  S --> App
  A --> App
  App --> MW
  MW --> SBAuth
  Pages --> PG
  Pages --> Pay
  API --> PG
  Pay -->|webhook| API
```

Protected areas (`/account`, `/seller`, `/admin`) rely on **Supabase Auth** session from middleware; **application data** in `public` is read/written via **Drizzle** on the server so keys and RLS posture stay safe (see `web/README.md`).

## Checkout sequence (happy path)

End-to-end payment flow as implemented: server action creates a **pending** order and Checkout Session; Stripe confirms payment asynchronously via webhook.

```mermaid
sequenceDiagram
  participant B as Buyer
  participant A as App
  participant D as DB
  participant P as Stripe

  B->>A: Submit checkout
  Note over A: createCheckoutSession
  A->>D: Insert address order and lines
  A->>P: Create checkout session
  P-->>B: Redirect to Checkout
  B->>P: Complete payment
  P->>A: Webhook session completed
  A->>A: Verify webhook signature
  A->>D: Mark order paid save payment
  B->>A: Open orders page
```

## Scripts (from `web/`)

- `npm run dev` — development server
- `npm run build` / `npm start` — production
- `npm run seed` — auth users + seed JSON
- `npm run test` — Vitest · `npm run test:e2e` — Playwright

## License

Private / not specified in-repo.
