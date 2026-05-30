import { expect, test } from "@playwright/test";

test("top page links to article and term archives", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "最新のプレスリリース" })).toBeVisible();
  await page.getByRole("link", { name: "過去の記事を見る" }).click();
  await expect(page.getByRole("heading", { name: "過去記事" })).toBeVisible();
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "用語帳" })).toBeVisible();
});
