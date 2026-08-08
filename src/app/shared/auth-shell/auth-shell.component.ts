import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecipeButtonComponent } from '../recipe-button/recipe-button.component';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [FormsModule, CommonModule, RecipeButtonComponent],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.css'
})
export class AuthShellComponent {
  private userService = inject(UserService);

  isLoginDialogOpen = false;
  username = '';
  password = '';
  accountMode: 'create' | 'existing' = 'existing';
  usePasswordless = false;
  confirmationText = '';

  get isLoggedIn(): boolean {
    return this.userService.isUserLoggedIn();
  }

  get userImageUrl(): string {
    return this.userService.getUserImageURL();
  }

  openLoginDialog(): void {
    this.isLoginDialogOpen = true;
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
    this.username = '';
    this.password = '';
    this.accountMode = 'existing';
    this.usePasswordless = false;
    this.confirmationText = '';
  }

  async submitLogin(): Promise<void> {
    if (this.usePasswordless) {
      if (this.username.trim()) {
        this.userService.setUserLoggedIn(true);
      }
      this.confirmationText = 'We have sent you an email. Open it and click the Login image to finish logging in.';
      return;
    }

    //Creating an account?
    if (this.accountMode === 'create') {
      const response = await this.userService.createNewUser(this.username, this.password);
      if (response.error && response.error === 'Email already in use') {
        this.confirmationText = 'This email is already registered. Please log in or use a different email.';
      } else {
        this.confirmationText = 'We have sent you an email. Open it and click the Confirm Email image to activate your account.';
      }
    }
  }
    /*if (this.username.trim() && this.password.trim()) {
      //WW Do this after logging in
      //this.userService.setUserLoggedIn(true);
      //this.closeLoginDialog();
      console.log(this.accountMode);
    }*/
}
