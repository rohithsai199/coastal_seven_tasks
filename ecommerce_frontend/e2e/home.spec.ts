import { test, expect } from "@playwright/test";

test("products page loads", async ({ page }) => {
  await page.goto("/products");

  await expect(page).toHaveURL(/\/products/);
});