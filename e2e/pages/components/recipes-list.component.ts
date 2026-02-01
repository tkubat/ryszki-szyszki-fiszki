import type { Locator, Page } from "@playwright/test";

import { RecipeCardComponent } from "./recipe-card.component";

export class RecipesListComponent {
  private readonly page: Page;
  readonly emptyStateButton: Locator;
  readonly retryButton: Locator;
  readonly listItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emptyStateButton = page.getByRole("button", { name: "Przejdź do Generuj" });
    this.retryButton = page.getByRole("button", { name: "Spróbuj ponownie" });
    this.listItems = page.locator("ul").locator("li");
  }

  recipeCard(title: string) {
    const root = this.page.locator("li").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
    return new RecipeCardComponent(this.page, root);
  }

  async goToGenerateFromEmptyState() {
    await this.emptyStateButton.click();
  }

  async retry() {
    await this.retryButton.click();
  }
}
