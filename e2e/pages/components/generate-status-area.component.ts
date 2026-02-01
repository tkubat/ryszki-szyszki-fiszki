import type { Locator, Page } from "@playwright/test";

export class GenerateStatusAreaComponent {
  readonly retryButton: Locator;
  readonly generateAnotherButton: Locator;

  constructor(page: Page) {
    this.retryButton = page.getByRole("button", { name: "Spróbuj ponownie" });
    this.generateAnotherButton = page.getByRole("button", { name: "Generuj kolejny" });
  }

  async retry() {
    await this.retryButton.click();
  }

  async generateAnother() {
    await this.generateAnotherButton.click();
  }
}
