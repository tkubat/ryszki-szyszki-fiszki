import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { AppPage, AuthPage } from "./pages";

const hasSupabaseAuth = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);

test.describe("Signup flow", () => {
  test.skip(!hasSupabaseAuth, "Supabase auth env is not configured for signup flow.");
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test("creates a new account via UI and validates via API", async ({ request }) => {
    const authPage = new AuthPage(page);
    const appPage = new AppPage(page);

    await authPage.goto();
    await handleBootScreen(authPage);

    await authPage.tabs.switchToSignup();
    await expect(authPage.signupForm.emailInput).toBeVisible({ timeout: 15000 });
    await expect(authPage.signupForm.passwordInput).toBeVisible();
    await expect(authPage.signupForm.submitButton).toBeDisabled();

    await expect(page).toHaveScreenshot("signup-form.png", { fullPage: true });

    const email = `test+${Date.now()}@example.com`;
    const password = "password123";

    await authPage.signupForm.fillEmail(email);
    await authPage.signupForm.fillPassword(password);
    await expect(authPage.signupForm.submitButton).toBeEnabled();
    await authPage.signupForm.submit();

    const signupResponse = await page.waitForResponse((response) => {
      return response.url().includes("/api/auth/signup") && response.request().method() === "POST";
    });
    if (!signupResponse.ok()) {
      const bodyText = await signupResponse.text();
      const errorMessage = extractSignupError(bodyText);
      if (isRateLimitError(signupResponse.status(), errorMessage)) {
        test.skip(true, "Signup rate limit reached. Use local Supabase or retry later.");
      }
      throw new Error(`Signup API failed (${signupResponse.status()}): ${errorMessage}`);
    }

    await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
    await expect(appPage.header.userBadge).toHaveAttribute("aria-label", `Zalogowany jako ${email}`);
    await expect(appPage.header.logoutButton).toBeVisible();

    const response = await request.post("/api/auth/login", {
      data: { email, password },
    });
    await expect(response).toBeOK();
    const payload = (await response.json()) as { user?: { email?: string } };
    expect(payload.user?.email).toBe(email);
  });
});

async function handleBootScreen(authPage: AuthPage) {
  const hasBootScreen = (await authPage.bootScreen.root.count()) > 0;
  if (!hasBootScreen) {
    return;
  }

  const canRetry = await authPage.bootScreen.retryButton.isVisible().catch(() => false);
  if (canRetry) {
    await authPage.bootScreen.retry();
  }
}

function extractSignupError(bodyText: string): string {
  if (!bodyText) {
    return "Empty response body";
  }

  try {
    const parsed = JSON.parse(bodyText) as { error?: { message?: string } };
    return parsed.error?.message ?? bodyText;
  } catch {
    return bodyText;
  }
}

function isRateLimitError(status: number, message: string): boolean {
  return status === 429 || message.toLowerCase().includes("rate limit");
}
