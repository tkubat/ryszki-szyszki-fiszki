import type { Locator, Page } from "@playwright/test";

export class RecipeCardComponent {
  private readonly page: Page;
  readonly root: Locator;
  readonly likeToggleButton: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
    this.likeToggleButton = this.root.getByRole("button", {
      name: /Polub przepis|Cofnij polubienie/,
    });
  }

  async toggleLike() {
    await this.likeToggleButton.click();
  }
}
