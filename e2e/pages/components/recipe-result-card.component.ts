import type { Locator, Page } from "@playwright/test";

export class RecipeResultCardComponent {
  readonly root: Locator;
  readonly title: Locator;
  readonly generationTime: Locator;
  readonly generateAnotherButton: Locator;

  constructor(page: Page) {
    this.root = page.locator("div").filter({
      has: page.getByRole("button", { name: "Generuj kolejny" }),
    });
    this.title = this.root.getByRole("heading");
    this.generationTime = this.root.getByText("Czas generowania:", { exact: false });
    this.generateAnotherButton = this.root.getByRole("button", { name: "Generuj kolejny" });
  }

  async generateAnother() {
    await this.generateAnotherButton.click();
  }
}
