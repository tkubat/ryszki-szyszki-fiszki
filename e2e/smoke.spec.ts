import { expect, test } from "@playwright/test";

import { AuthPage } from "./pages";

test.describe("Auth smoke", () => {
  test("shows login and signup flows", async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();

    const hasBootScreen = (await authPage.bootScreen.root.count()) > 0;
    if (hasBootScreen) {
      const canRetry = await authPage.bootScreen.retryButton.isVisible().catch(() => false);
      if (canRetry) {
        await authPage.bootScreen.retry();
      }
    }

    await expect(authPage.loginForm.emailInput).toBeVisible({ timeout: 15000 });
    await expect(authPage.tabs.tabList).toBeVisible();
    await expect(authPage.loginForm.passwordInput).toBeVisible();
    await expect(authPage.loginForm.submitButton).toBeDisabled();

    await authPage.loginForm.fillEmail("test@example.com");
    await authPage.loginForm.fillPassword("password123");
    await expect(authPage.loginForm.submitButton).toBeEnabled();

    await authPage.tabs.switchToSignup();
    await expect(authPage.signupForm.emailInput).toBeVisible();
    await expect(authPage.signupForm.passwordInput).toBeVisible();
    await expect(authPage.signupForm.submitButton).toBeDisabled();

    await authPage.signupForm.fillEmail("test@example.com");
    await authPage.signupForm.fillPassword("password123");
    await expect(authPage.signupForm.submitButton).toBeEnabled();

    await expect(page).toHaveScreenshot("auth-smoke.png", { fullPage: true });
  });
});
