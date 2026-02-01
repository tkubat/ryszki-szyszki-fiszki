import type { Locator, Page } from "@playwright/test";

export class GenerateRecipeFormComponent {
  readonly form: Locator;
  readonly ingredientsInput: Locator;
  readonly submitButton: Locator;
  readonly ingredientsCount: Locator;

  constructor(page: Page) {
    this.form = page.locator("form").filter({
      has: page.getByRole("button", { name: "Generuj przepis" }),
    });
    this.ingredientsInput = this.form.getByLabel("Składniki", { exact: true });
    this.submitButton = this.form.getByRole("button", { name: "Generuj przepis" });
    this.ingredientsCount = this.form.getByText("Liczba składników:", { exact: false });
  }

  async fillIngredients(value: string) {
    await this.ingredientsInput.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
