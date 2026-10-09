import { getCloudflareContext } from "@opennextjs/cloudflare";

export type CloudflareSecrets = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  AXIOM_TOKEN?: string;
};

export function cfEnv(): CloudflareEnv & CloudflareSecrets {
  const { env } = getCloudflareContext();
  return env as CloudflareEnv & CloudflareSecrets;
}

export function cfCtx() {
  return getCloudflareContext();
}

