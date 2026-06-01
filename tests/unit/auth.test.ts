import { beforeEach, describe, expect, it } from "vitest";
import { adminCookieOptions, issueAdminToken, verifyAdminToken, verifyPassword } from "@/lib/auth";

describe("auth", () => {
  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = "test-secret-that-is-long-enough";
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  it("issues and verifies an admin token", async () => {
    const token = await issueAdminToken();
    await expect(verifyAdminToken(token)).resolves.toBe(true);
  });

  it("rejects invalid tokens", async () => {
    await expect(verifyAdminToken("invalid")).resolves.toBe(false);
  });

  it("allows the development fallback password only outside production", async () => {
    await expect(verifyPassword("admin")).resolves.toBe(true);
    await expect(verifyPassword("wrong")).resolves.toBe(false);
  });

  it("does not mark admin cookies secure for plain HTTP requests", () => {
    const request = new Request("http://localhost:3000/api/admin/login");
    expect(adminCookieOptions(request).secure).toBe(false);
  });

  it("marks admin cookies secure for HTTPS requests and forwarded HTTPS", () => {
    const httpsRequest = new Request("https://example.com/api/admin/login");
    const forwardedRequest = new Request("http://example.com/api/admin/login", {
      headers: { "x-forwarded-proto": "https" }
    });

    expect(adminCookieOptions(httpsRequest).secure).toBe(true);
    expect(adminCookieOptions(forwardedRequest).secure).toBe(true);
  });
});
