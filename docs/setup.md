# Setup

## 1. Prereqs
- Node 22 (see `.nvmrc`)
- pnpm 9
- Cloudflare account + `wrangler login`
- Domain on Cloudflare

## 2. Install
```bash
pnpm install
cp .env.example .env.local
```

## 3. Create Cloudflare Bindings (for a New Project)
Run these commands to create your own Cloudflare infrastructure:
```bash
# Databases
wrangler d1 create saas_db
wrangler d1 create saas_db_preview

# KV (Cache & Next.js ISR)
wrangler kv namespace create CACHE
wrangler kv namespace create NEXT_INC_CACHE_KV
wrangler kv namespace create CACHE --preview

# R2 Buckets (Uploads & ISR cache)
wrangler r2 bucket create saas-uploads
wrangler r2 bucket create saas-uploads-preview
wrangler r2 bucket create saas-next-cache
wrangler r2 bucket create saas-next-cache-preview

# Queues (Optional background jobs)
wrangler queues create saas-jobs
wrangler queues create saas-jobs-preview
```
Paste the returned database IDs and KV IDs into `wrangler.toml` in the corresponding `[[d1_databases]]` and `[[kv_namespaces]]` blocks.

> **Security Note on `wrangler.toml`:**
> `database_id` and KV `id` are internal Cloudflare resource handles, **not credentials**. Without an authenticated Cloudflare API token or account session, no one can query or modify your database. Sensitive keys are stored separately as encrypted secrets.

## 4. Encrypted Secrets (Never in Git)
Real secrets must **never** be placed in `wrangler.toml`. Set them securely into Cloudflare's encrypted vault:
```bash
# Production secrets
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put GOOGLE_CLIENT_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put RESEND_API_KEY --env production

# Preview secrets (repeat with test keys)
wrangler secret put BETTER_AUTH_SECRET --env preview
wrangler secret put STRIPE_SECRET_KEY --env preview
```

## 5. DB Migrations
```bash
pnpm db:migrate:local     # local SQLite
pnpm db:migrate:preview   # preview D1
pnpm db:migrate:prod      # production D1
pnpm db:generate          # after editing db/schema: writes next SQL migration to db/migrations
```

## 6. Local Development
```bash
pnpm dev         # http://localhost:3000
pnpm typecheck   # verifies TypeScript + generates wrangler types
pnpm lint        # runs ESLint
pnpm test        # runs Vitest unit tests
```

## 7. Branch-Based Automated Deployment (GitHub Actions)
The repository uses an automated two-tier deployment architecture:
- **`preview` Branch (Staging/Testing):** Pushing to `preview` (or opening a PR to `main`) automatically tests, builds, applies preview DB migrations, and deploys to:
  👉 `https://saas-template-preview.whoisseth.workers.dev`
- **`main` Branch (Production):** Merging or pushing to `main` automatically deploys to:
  👉 `https://saas-template-prod.whoisseth.workers.dev`

### Recommended Development Workflow:
1. Work and commit on the `preview` branch:
   ```bash
   git checkout preview
   git add .
   git commit -m "feat: your new feature"
   git push origin preview
   ```
2. Verify and test your changes live on `https://saas-template-preview.whoisseth.workers.dev`.
3. When everything is verified, merge into `main` to deploy to production:
   ```bash
   git checkout main
   git merge preview
   git push origin main
   ```

## 8. Post-deploy & Integrations
- **Custom Domain:** Add your custom domain under Worker → Settings → Domains & Routes.
- **Google OAuth:** In Google Cloud Console, add `https://<your-domain>/api/auth/callback/google` to Authorized Redirect URIs.
- **Cloudinary Image Uploads:** Set your Cloud Name and unsigned upload preset in `wrangler.toml` and `.env.local`.
- **Stripe Webhooks:** Set endpoint to `https://<your-domain>/api/stripe/webhook`.
- **Resend:** Verify your sending domain (DKIM/SPF/DMARC) in Resend dashboard.
