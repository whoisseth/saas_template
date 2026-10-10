# SaaS Template

[![Website](https://img.shields.io/badge/website-omar16100.github.io-f38020)](https://omar16100.github.io/saas_template/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Website:** https://omar16100.github.io/saas_template/

Opinionated, Cloudflare-first SaaS starter. Clone, rename, deploy.

**Stack:** Next.js 16 (App Router) on Cloudflare Workers via `@opennextjs/cloudflare` · D1 + Drizzle · Better Auth (passkeys, MFA, OAuth, magic links) · Stripe hosted Checkout + Portal · Resend + CF Email Routing · shadcn/ui + Tailwind · GA4 + PostHog (consent-gated) · Turnstile · Axiom via Logpush · Vitest + Playwright · GitHub Actions CI + opt-in Cloudflare deploy.

**Rendering:** Marketing + blog → SSG/ISR (edge-cached, best SEO). Auth + dashboard → SSR. API routes → Workers.

---

## Why this template

- **One platform.** Every runtime dependency (compute, DB, files, cache, queues, email routing) lives on Cloudflare. One bill, one dashboard, one set of credentials.
- **SEO-first.** Static marketing + blog, dynamic sitemap, JSON-LD, IndexNow, `llms.txt`, preview auto-`noindex`, Lighthouse report on every PR (non-blocking).
- **Secure by default.** Route-scoped CSP, strict security headers, D1-backed Stripe webhook idempotency, Better Auth with passkeys, Turnstile widget and D1 rate-limit helpers, account delete + data export (see [Known gaps](#known-gaps)).
- **Boring, swappable stack.** Repository layer (`db/repo/*`) isolates D1 so you can swap to Postgres/Turso later without touching domain code.
- **No monorepo tax.** Flat Next.js app. Promote to a workspace later only if you genuinely need to.

---

## Quick start

```bash
git clone https://github.com/whoisseth/saas_template.git my-saas
cd my-saas
pnpm install
cp .env.example .env.local
# fill in BETTER_AUTH_SECRET at minimum: openssl rand -base64 32
pnpm dev
```

Visit `http://localhost:3000`.

The app boots with degraded features until you fill in credentials (auth needs the secret; Stripe/Resend/Turnstile each fail gracefully if unconfigured).

---

## Full setup for New Projects (Cloning Guide)

### 1. Prerequisites
- **Node 22** (see `.nvmrc`) & **pnpm 9**
- Cloudflare account with `wrangler login` executed in your terminal
- A custom domain on Cloudflare (for production deploy, optional for local dev)

### 2. Install & Local Environment
```bash
pnpm install
cp .env.example .env.local

# Generate a 32+ character secret for Better Auth:
openssl rand -base64 32
# Paste into .env.local -> BETTER_AUTH_SECRET
```

### 3. Create Cloudflare Bindings
When creating a new project from this template, create your own isolated Cloudflare infrastructure:
```bash
# Databases
wrangler d1 create saas_db
wrangler d1 create saas_db_preview

# KV (Cache & Next.js ISR)
wrangler kv namespace create CACHE
wrangler kv namespace create NEXT_INC_CACHE_KV
wrangler kv namespace create CACHE --preview

# R2 Buckets (Uploads + Next ISR cache)
wrangler r2 bucket create saas-uploads
wrangler r2 bucket create saas-uploads-preview
wrangler r2 bucket create saas-next-cache
wrangler r2 bucket create saas-next-cache-preview

# Queues (Optional background jobs)
wrangler queues create saas-jobs
wrangler queues create saas-jobs-preview
```

Paste the returned `database_id` and KV `id` values into `wrangler.toml` in the corresponding `[[d1_databases]]` and `[[kv_namespaces]]` blocks.

> **Security Note on `wrangler.toml`:**
> `database_id`, KV `id`, Google Client ID, and Cloudinary upload presets are internal resource identifiers, **not credentials**. Without an authenticated Cloudflare API token or account session, no one can query or modify your database. Sensitive server secrets are stored separately in Cloudflare's encrypted vault.

### 4. Encrypted Secrets (Never in Git)
Real server secrets must **never** be placed in `wrangler.toml` or committed to Git. Store them securely in Cloudflare's encrypted vault:
```bash
# Production Secrets
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put RESEND_API_KEY --env production

# Preview Secrets (repeat with test keys)
wrangler secret put BETTER_AUTH_SECRET --env preview
wrangler secret put STRIPE_SECRET_KEY --env preview
```

### 5. Database Migrations
```bash
pnpm db:migrate:local     # apply migrations to local SQLite
pnpm db:migrate:preview   # apply migrations to preview D1
pnpm db:migrate:prod      # apply migrations to production D1
pnpm db:generate          # after editing db/schema: writes next SQL migration to db/migrations
```

### 6. Local Development & Verification
```bash
pnpm dev         # http://localhost:3000
pnpm typecheck   # verifies TypeScript + generates worker bindings
pnpm lint        # ESLint
pnpm test        # Vitest unit tests (50+ tests)
```

### 7. Branch-Based Automated Deployment (GitHub Actions CI/CD)
The repository uses an automated two-tier deployment architecture:
- **`preview` Branch (Staging/Testing):** Pushing to `preview` (or opening a PR to `main`) automatically tests, builds, applies preview DB migrations, and deploys to:
  👉 `https://saas-template-preview.whoisseth.workers.dev`
- **`main` Branch (Production):** Merging or pushing to `main` automatically deploys to:
  👉 `https://saas-template-prod.whoisseth.workers.dev`

#### Daily Development Workflow:
1. Work and commit on the `preview` branch:
   ```bash
   git checkout preview
   git add .
   git commit -m "feat: your new feature"
   git push origin preview
   ```
2. Test your changes live on `https://saas-template-preview.whoisseth.workers.dev` (uses preview DB and preview KV cache without affecting production users).
3. Once verified, merge into `main` to deploy to production:
   ```bash
   git checkout main
   git merge preview
   git push origin main
   ```

### 8. Post-deploy Checklist & Integrations
- [ ] Add custom domain under Cloudflare Worker → Settings → Domains & Routes.
- [ ] Google OAuth: In Google Cloud Console, add `https://<your-domain>/api/auth/callback/google` to Authorized Redirect URIs.
- [ ] Cloudinary Image Uploads: Set your Cloud Name and unsigned upload preset in `wrangler.toml` and `.env.local`.
- [ ] Stripe Webhooks: Set endpoint to `https://<your-domain>/api/stripe/webhook` and paste signing secret.
- [ ] Resend: Verify your sending domain (DKIM/SPF/DMARC) in Resend dashboard.

See [docs/setup.md](docs/setup.md) for verbose details and runbooks.

---

## Environment variables

Full list in `.env.example`. Categorized in `docs/setup.md`. The minimum to boot locally: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `BETTER_AUTH_SECRET`.

---

## Project structure

```
app/
  (marketing)/     # SSG/ISR: landing, pricing, blog, legal
  (auth)/          # sign-in, sign-up, reset
  (app)/           # SSR, authed dashboard
  api/             # auth, stripe, indexnow, account, health
  sitemap.ts  robots.ts  feed.xml/
components/        # UI + consent + analytics + JSON-LD
content/blog/      # MDX posts
db/
  schema/          # Drizzle schema (auth, billing, app)
  repo/            # repository layer: D1 impl today, swappable
  migrations/      # SQL from `pnpm db:generate`, committed; CI fails if it is out of date
emails/            # react-email templates
lib/               # auth, db, stripe, resend, logger, csp, rate-limit, env
tests/             # unit (vitest) + e2e (playwright)
docs/              # index, c4model, setup, runbooks/, adr/
```

---

## What's included

- **Auth:** email+password, Google OAuth, magic links, passkeys, 2FA (Better Auth)
- **Billing:** Stripe hosted Checkout, Customer Portal, webhook with D1 idempotency, Stripe Tax
- **Email:** Resend outbound + react-email templates (welcome, verify, reset, magic link, deletion)
- **Bot / abuse:** Turnstile widget on sign-in/sign-up, D1 fixed-window rate limiter helper (both still to be wired into routes, see [Known gaps](#known-gaps))
- **Security:** route-scoped CSP (static for marketing = SSG-safe, nonce for app), HSTS, X-Frame-Options DENY, no-sniff, strict Referrer-Policy, Permissions-Policy
- **SEO:** dynamic sitemap, robots (preview `noindex`), RSS, JSON-LD (Organization / WebSite+SearchAction / BreadcrumbList / Article / FAQPage / SoftwareApplication), IndexNow endpoint, `llms.txt`, canonical URLs on blog posts and legal pages, consent-gated GA4 + PostHog, web-vitals → PostHog, Lighthouse report on PRs
- **Privacy:** consent banner gates analytics, account delete w/ 30-day grace (enqueued; consumer not included yet), account data export to R2
- **Ops:** structured JSON logging (ship to Axiom with Cloudflare Logpush, see `docs/setup.md`), CI (lint, typecheck, unit tests, migration generation, production build, non-blocking Lighthouse on PRs), opt-in deploy (preview per PR, prod on main), Dependabot
- **Docs:** C4 diagram, setup, runbooks (D1 escape hatch, backup/restore, Stripe isolation, passkey domain binding), ADR

## Known gaps

`.github/workflows/ci.yml` installs, lints, typechecks, tests and builds the template on every PR and push to `main`. As of 27 Sep 2026 these parts are scaffolded rather than wired end to end (tracked in `todo.md`):

- Turnstile: the widget renders on sign-in/sign-up, but no route calls `verifyTurnstile` in `lib/turnstile.ts`.
- Rate limiting: `lib/rate-limit.ts` exists, but no route calls it.
- Account deletion enqueues a purge job, but no queue consumer processes it.
- The root layout sets canonical `/`, so pages without their own `alternates.canonical` (pricing, blog index, auth pages) point search engines at the homepage.
- Billing: the pricing button reads `NEXT_PUBLIC_STRIPE_PRICE_*` while `.env.example` defines `STRIPE_PRICE_*`; the dashboard "Manage billing" form receives the portal URL as JSON instead of being redirected; the webhook records an event before applying it, so a failed apply is not retried.

## Intentionally not included

- Monorepo / Turborepo (flat app; promote only when needed)
- Multi-tenancy / orgs (single-user model; extension path in ADR)
- i18n / hreflang
- Storybook
- Status page
- Newsletter
- Custom ML/AI features

---

## Philosophy

Every dependency was picked to **reduce later regret, not to maximize current convenience**:

- Stripe *hosted* Checkout over embedded payment UI → card details are entered on Stripe's page, not yours, and CSP stays simple
- D1 *with a repo boundary* → cheap today, swappable when you outgrow D1's size limits
- Flat app *without* a monorepo → no scaffolding tax until you actually have multiple apps
- Better Auth *without* custom CSRF → one layer, not two that fight each other
- SSG for SEO pages *always* → crawlers see instant HTML, Google rewards you, cache misses never hit origin

---

## License

MIT, see `LICENSE`.

## Contributing

PRs welcome. Before submitting:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Keep the template opinionated: if a feature is "nice to have for some projects", put it in `docs/` as an extension, not in the main template.
