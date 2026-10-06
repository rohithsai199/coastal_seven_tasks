import { test, expect } from "@playwright/test";

// ─── Home / Products page ────────────────────────────────────────────────────
test.describe("Products page", () => {
  test("loads products page with correct URL", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);
  });

  test("page title is present", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveTitle(/.+/); // any non-empty title
  });

  test("product cards render on the products page", async ({ page }) => {
    await page.goto("/products");
    // Wait for at least one product card to appear
    await page.waitForSelector("article", { timeout: 10000 });
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────
test.describe("Navigation", () => {
  test("navigating to / redirects or shows content", async ({ page }) => {
    const response = await page.goto("/");
    // Should not return a 5xx error
    expect(response?.status()).toBeLessThan(500);
  });

  test("navigating to /login shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    // Expect an email input or similar form field
    const emailField = page.locator("input[type='email'], input[name='email']");
    await expect(emailField.first()).toBeVisible();
  });

  test("navigating to /register shows register form", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
    const emailField = page.locator("input[type='email'], input[name='email']");
    await expect(emailField.first()).toBeVisible();
  });
});

// ─── Auth flow ────────────────────────────────────────────────────────────────
test.describe("Authentication", () => {
  test("login page renders email and password inputs", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator("input[type='email'], input[name='email']");
    const passwordInput = page.locator("input[type='password']");
    const submitBtn = page.locator("button[type='submit']");

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitBtn.first()).toBeVisible();
  });

  test("login form accepts user input", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    const passwordInput = page.locator("input[type='password']").first();

    await emailInput.fill("test@example.com");
    await passwordInput.fill("password123");

    await expect(emailInput).toHaveValue("test@example.com");
    await expect(passwordInput).toHaveValue("password123");
  });
});

// ─── Cart flow ────────────────────────────────────────────────────────────────
test.describe("Cart", () => {
  test("navigating to /cart when unauthenticated shows login or cart page", async ({ page }) => {
    const response = await page.goto("/cart");
    // Should load without a server error
    expect(response?.status()).toBeLessThan(500);
  });
});

// ─── Orders flow ──────────────────────────────────────────────────────────────
test.describe("Orders", () => {
  test("navigating to /orders redirects unauthenticated users or shows page", async ({ page }) => {
    const response = await page.goto("/orders");
    expect(response?.status()).toBeLessThan(500);
  });
});