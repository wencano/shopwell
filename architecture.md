# ShopWell — Technical Architecture

**Product:** ShopWell — a multivendor marketplace for an Australian wellness brand.  
**MVP scope:** Single seeded store, full role model (super admin, seller, buyer), catalog, orders, and standard pages; all domains and copy oriented to AU (currency AUD, privacy/shipping copy placeholders).

This document describes the target system before implementation. Code lives outside this file.

---

## 1. Goals and constraints

| Goal | Notes |
|------|--------|
| Multivendor-ready | Data model and admin UX support many stores; **seed only one store** initially. |
| Clear separation | Super admin, seller portal, buyer account, and public storefront. |
| Trust and compliance | AU-facing wellness context: clear product claims boundaries, privacy policy and terms pages (content TBD). |
| Observable commerce | Orders, payments, and fulfillment status traceable by each role. |

**Non-goals for first implementation pass:** Mobile apps, advanced search (Algolia), multi-region fulfillment logic, native tax engines beyond Stripe/AU defaults documentation.

---

## 2. Tech stack (mandated)

| Layer | Choice |
|--------|--------|
| Framework | **Next.js** (App Router), TypeScript |
| Backend data | **Supabase** — Auth, Postgres, Row Level Security (RLS), **Storage** (product and brand images) |
| ORM / migrations | **Drizzle ORM** against Supabase Postgres |
| UI | **shadcn/ui** + **Tailwind CSS** |
| Client state | **Zustand** (UI/session-adjacent client state); **TanStack Query** (server state, caching, mutations) |
| Forms | **React Hook Form** + **Zod** |
| Payments | **Stripe** (Checkout or Payment Element + webhooks; Connect deferred or flagged as phase 2 — see §7) |
| Email | **Resend** + **React Email** (transactional: order confirmation, seller invites, password reset complements Supabase) |
| Testing | **Vitest** (unit/integration); **Playwright** (E2E critical paths) |

---

## 3. Actors and surfaces

```mermaid
flowchart TB
  subgraph Public
    P_Catalog[Product catalog]
    P_PDP[Product detail]
    P_Static[Static pages]
  end
  subgraph Buyer
    B_Cart[Cart / checkout]
    B_Account[Account & orders]
  end
  subgraph Seller
    S_Dash[Seller dashboard]
    S_Products[Products & inventory]
    S_Orders[Store orders]
  end
  subgraph SuperAdmin
    A_Stores[Stores & onboarding]
    A_Users[Users & roles]
    A_Global[Global products / moderation]
    A_Orders[Cross-store orders view]
  end
  Public --> Buyer
  Buyer --> Stripe[Stripe hosted / elements]
  Seller --> Supabase[(Supabase)]
  SuperAdmin --> Supabase
  Buyer --> Supabase
```

| Actor | Primary routes (illustrative) | Capabilities |
|--------|-------------------------------|--------------|
| **Visitor / buyer** | `/`, `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/account/*`, static pages | Browse, purchase, manage profile and order history. |
| **Seller** | `/seller/*` (or `/dashboard` scoped by role) | CRUD products for **assigned store(s)**, view/update orders for that store, manage inventory fields. |
| **Super admin** | `/admin/*` | Create/edit **stores**, assign **roles** (promote seller, bind user ↔ store), global product/order oversight, feature flags / site config (minimal in MVP). |

Authentication via Supabase; Next.js middleware protects `/admin`, `/seller`, `/account` by server-side session and role claims.

---

## 4. High-level system context

```mermaid
flowchart LR
  User[Buyers / Sellers / Admins]
  Next[Next.js App Router]
  SBAuth[Supabase Auth]
  SBDB[(Postgres + RLS)]
  SBSt[Supabase Storage]
  Stripe[Stripe API]
  Resend[Resend]

  User --> Next
  Next --> SBAuth
  Next --> SBDB
  Next --> SBSt
  Next --> Stripe
  Next --> Resend
  Stripe -->|webhooks| Next
```

---

## 5. Domain model (conceptual)

Core entities (Drizzle tables — names indicative):

- **`profiles`** — `user_id` (FK to `auth.users`), display name, avatar URL, default address refs, `role` or separate **`user_roles`** for flexibility (recommended: `user_roles` with `role` enum + optional `store_id`).
- **`stores`** — name, slug, description, logo URL, status (`active` | `suspended`), region/currency defaults (AUD).
- **`store_members`** — `store_id`, `user_id`, `member_role` (`owner` | `staff`).
- **`categories`** — hierarchical optional; linked to products.
- **`products`** — `store_id`, title, slug, description, price (cents AUD), status (`draft` | `published` | `archived`), stock quantity (or separate inventory table if needed later).
- **`product_images`** — ordering, `storage_path` or public URL, alt text.
- **`orders`** — `buyer_user_id`, totals, currency, Stripe identifiers, fulfillment status enum, shipping snapshot.
- **`order_items`** — `order_id`, `product_id`, quantity, unit price snapshot, `store_id` (denormalized for multivendor splits).
- **`addresses`** — for billing/shipping snapshots; optional reuse from profile.

**Multivendor note:** Each `product` belongs to one `store`. An order can contain line items from one store in MVP (simplifies shipping and payouts); architecture allows multi-store carts later by keeping `store_id` on each line.

---

## 6. Row Level Security (RLS) principles

- **Buyers:** read published products; CRUD own profile addresses; read/write own cart session (if DB-backed); read own orders.
- **Sellers:** full access to products/order_items where `store_id` is in their `store_members` rows; no access to other stores’ financial detail beyond aggregations if needed.
- **Super admin:** service role or dedicated policy bypass via server-only Supabase client for admin routes (prefer **server actions / Route Handlers** with role check + Supabase admin client for mutations).
- **Storage:** public read for published product assets; write restricted to sellers of that store and admins.

Detailed policies are implemented in SQL migrations alongside Drizzle schema.

---

## 7. Payments (Stripe)

**MVP recommendation:** **Stripe Checkout** (or Payment Element) with a single connected business bank account for the seeded store; record `payment_intent_id` / `session_id` on `orders`.

**Phase 2 (documented, not required day one):** **Stripe Connect** (Express or Standard) per `store` for automated splits and payouts; webhooks for `account.updated`, transfers, and disputes.

```mermaid
sequenceDiagram
  participant B as Buyer
  participant N as Next.js
  participant S as Stripe
  participant SB as Supabase

  B->>N: Checkout (cart, address)
  N->>SB: Create order (pending_payment)
  N->>S: Create Checkout Session / PaymentIntent
  S-->>B: Redirect / client secret
  B->>S: Complete payment
  S->>N: Webhook checkout.session.completed
  N->>SB: Mark order paid, reduce stock
  N->>R: Send order confirmation (async)
  Note over N,R: Resend + React Email
```

---

## 8. Application layering (Next.js App Router)

- **`app/(public)/`** — marketing, catalog, PDP, static legal/info pages.
- **`app/(buyer)/account/`** — orders, profile (session required).
- **`app/(seller)/seller/`** — seller layout; products, orders (role: store member).
- **`app/(admin)/admin/`** — super admin layout; stores, users, global listing.
- **API:** Route Handlers for Stripe webhooks, Resend webhooks if needed, and any server-only mutations that must not be exposed client-side.
- **Server Components** for initial data where possible; **TanStack Query** in client islands for interactive lists and mutations.
- **Zustand** for UI-only state (e.g., cart drawer open, multi-step checkout steps) — optionally backed by TanStack Query persistence for cart sync.

---

## 9. Key sequences

### 9.1 Super admin: create store and attach seller

```mermaid
sequenceDiagram
  participant A as Super admin
  participant N as Next.js (admin)
  participant SB as Supabase Auth + DB
  participant E as Resend

  A->>N: Create store + invite seller email
  N->>SB: Insert store, store_members (pending user)
  N->>E: Send invite / magic link email
  E->>Seller: Email with signup link
  Seller->>SB: Complete Auth signup
  N->>SB: Link profile + role, activate membership
```

### 9.2 Seller: publish product with images

```mermaid
sequenceDiagram
  participant V as Seller
  participant N as Next.js (seller)
  participant ST as Supabase Storage
  participant DB as Postgres

  V->>N: Create draft product + upload images
  N->>ST: Upload to store-scoped path
  ST-->>N: Public/signed URL
  N->>DB: Insert product + product_images
  V->>N: Publish product
  N->>DB: Set status published (RLS-checked)
```

### 9.3 Buyer: browse and purchase (happy path)

```mermaid
sequenceDiagram
  participant B as Buyer
  participant N as Next.js
  participant Q as TanStack Query
  participant SB as Supabase
  participant ST as Stripe

  B->>N: Open catalog
  N->>Q: Fetch products
  Q->>SB: Read published products
  B->>N: Add to cart (Zustand + optional persist)
  B->>N: Checkout
  N->>SB: Validate stock, create pending order
  N->>ST: Create payment
  ST-->>B: Pay
  ST->>N: Webhook success
  N->>SB: Confirm order, decrement stock
```

---

## 10. Order and fulfillment state (conceptual)

```mermaid
stateDiagram-v2
  [*] --> pending_payment
  pending_payment --> paid: Webhook confirmed
  pending_payment --> cancelled: Timeout / user cancel
  paid --> processing: Seller acknowledges
  paid --> refunded: Refund issued
  processing --> shipped: Carrier / manual update
  shipped --> delivered: Buyer confirmation or SLA
  delivered --> [*]
  refunded --> [*]
  cancelled --> [*]
```

Exact enum values are finalized in schema migrations; MVP may collapse to `pending_payment` | `paid` | `fulfilled` | `cancelled` before expanding.

---

## 11. Email templates (React Email + Resend)

| Template | Trigger |
|----------|---------|
| Order confirmation | After successful payment |
| Seller new order | Notify store members |
| Invite / role assignment | Super admin invites seller |
| Password reset | Supabase-native; optional branded wrapper via Resend if custom domain required |

---

## 12. SEO and standard pages

- **Standard pages:** `/about`, `/contact`, `/shipping-returns`, `/privacy`, `/terms` (AU-appropriate placeholders).
- **Catalog SEO:** metadata per product from DB; `sitemap.xml` and `robots.txt` via App Router routes.
- **Structured data:** Product JSON-LD on PDP (optional in first sprint, listed in todo).

---

## 13. Observability and quality

- **Vitest:** Drizzle helpers, pricing math, order total calculations, Zod schemas, role guards.
- **Playwright:** Guest browse → add to cart → checkout (test mode Stripe); seller login → create draft product; admin login → view orders (use test users from seed).
- **Env separation:** `.env.local` for dev; documented vars for Supabase URL/keys, Stripe secret/webhook secret, Resend API key.

---

## 14. Seed data (MVP)

- **One store** (e.g., “ShopWell Wellbeing Co”) with logo and hero imagery in Storage.
- **Users:** one super admin, one seller (store member), one buyer (optional second buyer).
- **Categories:** 3–5 wellness categories.
- **Products:** ~10–15 products with **realistic titles, descriptions, AUD prices**, multiple images each (uploaded to Storage; referenced in `product_images`).
- **Optional:** 1–2 completed orders for demo dashboards (Stripe test mode or marked `paid` manually in seed script).

Seed implemented via Drizzle SQL/TS seed script or Supabase CLI + custom script; idempotent where possible.

---

## 15. Security checklist (implementation)

- Never expose service role key to the browser.
- Validate Stripe webhooks with signing secret.
- CSRF-safe patterns for state-changing Route Handlers where cookies are involved.
- Upload validation: MIME type, max size, filename hygiene; store-scoped paths.
- Rate limiting on auth-sensitive routes (optional: Vercel/Edge middleware or Supabase built-ins).

---

## 16. Open decisions (resolve during build)

1. **Cart persistence:** pure client (Zustand + localStorage) vs. `carts` table for logged-in users — recommend **logged-in DB cart** + guest Zustand with merge on login.
2. **Stripe Connect timing:** MVP single legal entity vs. immediate Connect — default **single entity**; document Connect migration path in `todo.md`.
3. **Product moderation:** super admin approval before `published` vs. seller self-publish — default **self-publish** with admin ability to archive.

---

*End of document — ready for review before implementation.*
