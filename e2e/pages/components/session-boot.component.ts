import type { Locator, Page } from "@playwright/test";

export class SessionBootComponent {
  readonly root: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId("session-boot");
    this.retryButton = page.getByTestId("session-boot-retry");
  }

  async retry() {
    await this.retryButton.click();
  }
}
