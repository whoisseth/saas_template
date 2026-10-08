import { describe, it, expect, vi } from "vitest";

const { getCloudflareContext } = vi.hoisted(() => ({ getCloudflareContext: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_APP_NAME: "SaaS Template",
    NEXT_PUBLIC_IS_PREVIEW: false,
    BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
    BETTER_AUTH_RP_ID: "localhost",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  },
}));

describe("auth social providers", () => {
  it("configures google social provider when credentials exist", async () => {
    getCloudflareContext.mockImplementation(() => ({ env: { DB: {} } }));
    const { getAuth } = await import("@/lib/auth");
    const auth = getAuth();
    expect(auth.options.socialProviders).toBeDefined();
    expect(auth.options.socialProviders?.google).toBeDefined();
    expect(auth.options.socialProviders?.google?.clientId).toBe("test-google-client-id");
    expect(auth.options.socialProviders?.google?.clientSecret).toBe("test-google-client-secret");
  });
});
