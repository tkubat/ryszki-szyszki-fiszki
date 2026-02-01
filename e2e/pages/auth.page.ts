import type { Page } from "@playwright/test";

import { BasePage } from "./base.page";
import { AuthTabsComponent } from "./components/auth-tabs.component";
import { LoginFormComponent } from "./components/login-form.component";
import { SessionBootComponent } from "./components/session-boot.component";
import { SignupFormComponent } from "./components/signup-form.component";

export class AuthPage extends BasePage {
  readonly tabs: AuthTabsComponent;
  readonly loginForm: LoginFormComponent;
  readonly bootScreen: SessionBootComponent;
  readonly signupForm: SignupFormComponent;

  constructor(page: Page) {
    super(page);
    this.tabs = new AuthTabsComponent(page);
    this.loginForm = new LoginFormComponent(page);
    this.bootScreen = new SessionBootComponent(page);
    this.signupForm = new SignupFormComponent(page);
  }

  async goto() {
    await super.goto("/auth");
  }
}
