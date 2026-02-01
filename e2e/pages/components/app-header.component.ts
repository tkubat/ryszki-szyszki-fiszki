import type { Locator, Page } from "@playwright/test";

export class AppHeaderComponent {
  readonly root: Locator;
  readonly userBadge: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.root = page.locator("header").filter({
      has: page.getByRole("button", { name: "Wyloguj" }),
    });
    this.userBadge = this.root.getByLabel(/Zalogowany jako/i);
    this.logoutButton = this.root.getByRole("button", { name: "Wyloguj" });
  }

  async logout() {
    await this.logoutButton.click();
  }
}
