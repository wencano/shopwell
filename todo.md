# ShopWell — Implementation TODO

Check items off as work completes. **Order is suggested, not mandatory** where parallel work is possible.

This list follows [design-docs/architecture.md](./design-docs/architecture.md). No application code was written at doc creation time.

---

## Phase 0 — Project setup

- [ ] Initialize Next.js (App Router, TypeScript, `@/*` alias, strict ESLint)
- [ ] Add Tailwind CSS and configure `tailwind.config` / `globals.css`
- [ ] Install and init **shadcn/ui** (base components: button, input, form, card, dialog, dropdown, sheet, table, toast, skeleton)
- [ ] Add **Drizzle ORM** + `drizzle-kit`; configure connection to Supabase Postgres (pooler URL for serverless)
- [ ] Add **Supabase** JS clients (`@supabase/supabase-js`, SSR helpers for Next.js)
- [ ] Environment template: `.env.example` (public + server-only keys documented)
- [ ] Folder conventions: `app/`, `components/`, `lib/`, `db/schema`, `db/migrations`, `emails/`, `e2e/`

## Phase 1 — Database and auth

- [ ] Drizzle schema: `profiles`, `user_roles`, `stores`, `store_members`, `categories`, `products`, `product_images`, `orders`, `order_items`, `addresses` (adjust to match architecture)
- [ ] SQL migrations + **RLS policies** and Storage bucket policies (aligned with §6 of architecture doc)
- [ ] Supabase Auth: email/password or magic link per product decision; sync `profiles` on signup (trigger or app hook)
- [ ] Role model: `super_admin`, `seller`, `buyer` (enforce in middleware + server actions)
- [ ] Next.js **middleware**: session refresh, route protection for `/admin`, `/seller`, `/account`

## Phase 2 — Storage and assets

- [ ] Create buckets: `product-images`, `brand-assets` (or single bucket with prefixes)
- [ ] Upload utilities + validation (size, type, store-scoped paths)
- [ ] Image component strategy: Next.js `Image` + known remote patterns for Supabase public URLs

## Phase 3 — Seeding

- [ ] Seed script: one **store**, categories, **10–15 products** with descriptions and AUD prices
- [ ] Seed users: super admin, seller (linked to store), buyer
- [ ] Upload **seed images** to Storage; link rows in `product_images`
- [ ] Optional: demo `paid` orders for dashboard screenshots — sample rows in [seed/shopwell.seed.json](./seed/shopwell.seed.json)
- [ ] Import [seed/shopwell.seed.json](./seed/shopwell.seed.json) from the app seed script (manual AU demo; hotlinked images for dev only)

## Phase 4 — Public storefront

- [ ] Layout: header/footer, AU wellness branding placeholders
- [ ] **Home** page: hero, featured products
- [ ] **Catalog** `/products`: filters (category), search (basic), pagination
- [ ] **PDP** `/products/[slug]`: gallery, price AUD, add to cart
- [ ] **Static pages:** about, contact, shipping-returns, privacy, terms
- [ ] `sitemap.ts`, `robots.ts`; basic metadata API

## Phase 5 — Buyer experience

- [ ] **Zustand** cart store (+ optional persist); merge on login if DB cart chosen
- [ ] **TanStack Query** provider + query keys convention
- [ ] Cart page / drawer; stock validation on checkout
- [ ] Checkout flow: address collection (**React Hook Form** + **Zod**)
- [ ] Create pending order server-side; integrate **Stripe** Checkout or Payment Element (test mode)
- [ ] Stripe **webhook** Route Handler: verify signature, mark order paid, decrement stock idempotently
- [ ] **Resend** + **React Email**: order confirmation to buyer; optional seller “new order” email

## Phase 6 — Seller portal

- [ ] Seller layout and nav
- [ ] Product list (draft/published); create/edit product with image uploads
- [ ] Store orders list + detail; update fulfillment status (aligned with state machine in architecture)
- [ ] TanStack Query mutations with optimistic UI where safe

## Phase 7 — Super admin

- [ ] Admin layout and nav
- [ ] Stores CRUD; assign **store_members**/roles
- [ ] Users directory (read/search); role assignment
- [ ] Global products view (all stores); archive/unpublish capability
- [ ] Cross-store orders table (filters by store, status)
- [ ] Invite flow: Resend email + Supabase invite or magic link (document chosen approach)

## Phase 8 — Hardening and tests

- [ ] **Vitest:** Zod schemas, money calculations, role helpers, webhook idempotency unit tests
- [ ] **Playwright:** smoke paths (catalog → checkout with Stripe test card); seller product CRUD; admin login gate
- [ ] CI suggestion: run Vitest + Playwright on PR (document in README if CI not configured here)
- [ ] Security pass: no service keys client-side, webhook-only mutations for payment state

## Phase 9 — Polish (post-review)

- [ ] Product JSON-LD on PDP
- [ ] Error boundaries and branded 404/500
- [ ] Loading and empty states consistency (shadcn patterns)
- [ ] README: local dev (Supabase local vs cloud), Stripe CLI webhooks, seed instructions

---

## Resolved defaults (from architecture doc)

| Topic | Default for MVP |
|--------|------------------|
| Multivendor payouts | Single Stripe business entity; **Connect** = phase 2 |
| Cart | Prefer logged-in DB cart + guest Zustand merge (finalize in Phase 5) |
| Publishing | Seller self-publish; admin can archive |

---

## Review gate

- [ ] Stakeholder review of **design-docs/architecture.md** (diagrams, RLS, Stripe scope)
- [ ] Stakeholder review of **this todo.md** (phases, open decisions)
- [ ] Proceed with code only after sign-off

---

*Last updated: doc-only creation — no code scaffold yet.*
