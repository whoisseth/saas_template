import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";
import { cfEnv } from "./cf";
import { describeError, log, logBetterAuthEvent } from "./logger";
import { sendMagicLinkEmail, sendVerifyEmail, sendResetEmail } from "./resend";

function getRuntimeAuthEnv() {
  try {
    const cf = cfEnv();
    if (cf) {
      return {
        appUrl: cf.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL,
        authUrl: cf.BETTER_AUTH_URL || cf.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL || env.NEXT_PUBLIC_APP_URL,
        authSecret: cf.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET,
        rpId: cf.BETTER_AUTH_RP_ID || env.BETTER_AUTH_RP_ID,
        appName: cf.NEXT_PUBLIC_APP_NAME || env.NEXT_PUBLIC_APP_NAME,
        isPreview: cf.NEXT_PUBLIC_IS_PREVIEW === "true",
        googleClientId: cf.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID,
        googleClientSecret: cf.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET,
      };
    }
  } catch {
    // Outside Cloudflare context (e.g. tests or build time)
  }
  return {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    authUrl: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
    authSecret: env.BETTER_AUTH_SECRET,
    rpId: env.BETTER_AUTH_RP_ID,
    appName: env.NEXT_PUBLIC_APP_NAME,
    isPreview: Boolean(env.NEXT_PUBLIC_IS_PREVIEW),
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

// Built per call, never at module load: the D1 binding only exists inside a request
// (getCloudflareContext), and `next build` evaluates route modules outside of one.
export function getAuth() {
  const runtime = getRuntimeAuthEnv();
  const baseURL = runtime.authUrl;

  return betterAuth({
    baseURL,
    secret: runtime.authSecret,
    logger: { log: logBetterAuthEvent },
    // Unexpected (non-API) errors are rethrown to handleAuthRequest; otherwise better-call prints them
    // raw with console.error, and drizzle query errors carry bound values such as tokens.
    onAPIError: { throw: true },
    trustedOrigins: [runtime.appUrl],
    database: drizzleAdapter(db(), { provider: "sqlite" }),
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !runtime.isPreview,
      sendResetPassword: async ({ user, url }) => {
        await sendResetEmail(user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerifyEmail(user.email, url);
      },
    },
    socialProviders:
      runtime.googleClientId && runtime.googleClientSecret
        ? {
            google: {
              clientId: runtime.googleClientId,
              clientSecret: runtime.googleClientSecret,
            },
          }
        : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      cookiePrefix: "saas",
      useSecureCookies: !runtime.isPreview && runtime.appUrl.startsWith("https://"),
    },
    plugins: [
      passkey({
        rpID: runtime.rpId,
        rpName: runtime.appName,
        origin: runtime.appUrl,
      }),
      twoFactor(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof getAuth>;
export type Session = Auth["$Infer"]["Session"];

// Handler for app/api/auth/[...all]. API errors already come back as responses; anything else is
// logged without query parameters and answered with a bare 500.
export async function handleAuthRequest(request: Request): Promise<Response> {
  try {
    return await getAuth().handler(request);
  } catch (err) {
    try {
      log.error("auth_request_failed", { error: describeError(err) });
    } catch {
      // The response must not depend on the error being describable.
      log.error("auth_request_failed", { error: "undescribable" });
    }
    return new Response(null, { status: 500 });
  }
}
