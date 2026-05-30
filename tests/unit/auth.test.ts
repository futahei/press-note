import { beforeEach, describe, expect, it } from "vitest";
import { issueAdminToken, verifyAdminToken, verifyPassword } from "@/lib/auth";

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
});
