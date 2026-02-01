import type { Page } from "@playwright/test";

import { BasePage } from "./base.page";
import { AppHeaderComponent } from "./components/app-header.component";
import { AppTabsComponent } from "./components/app-tabs.component";
import { GenerateRecipeFormComponent } from "./components/generate-recipe-form.component";
import { GenerateStatusAreaComponent } from "./components/generate-status-area.component";
import { RecipeResultCardComponent } from "./components/recipe-result-card.component";
import { RecipesListComponent } from "./components/recipes-list.component";

export class AppPage extends BasePage {
  readonly header: AppHeaderComponent;
  readonly tabs: AppTabsComponent;
  readonly generateForm: GenerateRecipeFormComponent;
  readonly generateStatus: GenerateStatusAreaComponent;
  readonly recipeResultCard: RecipeResultCardComponent;
  readonly recipesList: RecipesListComponent;

  constructor(page: Page) {
    super(page);
    this.header = new AppHeaderComponent(page);
    this.tabs = new AppTabsComponent(page);
    this.generateForm = new GenerateRecipeFormComponent(page);
    this.generateStatus = new GenerateStatusAreaComponent(page);
    this.recipeResultCard = new RecipeResultCardComponent(page);
    this.recipesList = new RecipesListComponent(page);
  }

  async goto() {
    await super.goto("/app");
  }
}
