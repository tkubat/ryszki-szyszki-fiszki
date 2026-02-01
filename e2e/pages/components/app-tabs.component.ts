import type { Locator, Page } from "@playwright/test";

export class AppTabsComponent {
  readonly tabList: Locator;
  readonly generateTab: Locator;
  readonly recipesTab: Locator;

  constructor(page: Page) {
    this.tabList = page.getByRole("tablist").filter({ has: page.getByRole("tab", { name: "Generuj" }) });
    this.generateTab = this.tabList.getByRole("tab", { name: "Generuj" });
    this.recipesTab = this.tabList.getByRole("tab", { name: "Moje przepisy" });
  }

  async openGenerate() {
    await this.generateTab.click();
  }

  async openRecipes() {
    await this.recipesTab.click();
  }
}
