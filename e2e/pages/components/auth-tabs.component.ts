import type { Locator, Page } from "@playwright/test";

export class AuthTabsComponent {
  private readonly page: Page;
  readonly tabList: Locator;
  readonly loginTab: Locator;
  readonly signupTab: Locator;
  readonly switchToSignupLink: Locator;
  readonly switchToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tabList = page.getByTestId("auth-tabs");
    this.loginTab = page.getByTestId("auth-tab-login");
    this.signupTab = page.getByTestId("auth-tab-signup");
    this.switchToSignupLink = page.getByRole("button", { name: "Zarejestruj się" });
    this.switchToLoginLink = page.getByRole("button", { name: "Zaloguj się" });
  }

  async openLoginTab() {
    await this.loginTab.click();
  }

  async openSignupTab() {
    await this.signupTab.click();
  }

  async switchToSignup() {
    await this.switchToSignupLink.click();
  }

  async switchToLogin() {
    await this.switchToLoginLink.click();
  }
}
