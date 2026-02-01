import type { Locator, Page } from "@playwright/test";

export class SignupFormComponent {
  private readonly page: Page;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("signup-form");
    this.emailInput = page.getByTestId("signup-email");
    this.passwordInput = page.getByTestId("signup-password");
    this.submitButton = page.getByTestId("signup-submit");
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async signup(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}
