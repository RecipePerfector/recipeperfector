import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecipeButtonComponent } from '../recipe-button/recipe-button.component';
import { AccountMenuComponent } from '../account-menu/account-menu.component';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [FormsModule, CommonModule, RecipeButtonComponent, AccountMenuComponent],
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
  isCreatingAccount = false;
  userImageUrl = '';
  isAccountMenuOpen = false;

  get isLoggedIn(): boolean {
    return this.userService.isUserLoggedIn();
  }

  openLoginDialog(): void {
    this.isLoginDialogOpen = true;
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  logout(): void {
    this.userService.logout();
    this.isAccountMenuOpen = false;
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
    this.isAccountMenuOpen = false;
    this.username = '';
    this.password = '';
    this.accountMode = 'existing';
    this.usePasswordless = false;
    this.confirmationText = '';
    this.isCreatingAccount = false;
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
      this.isCreatingAccount = true;
      try {
        const response = await this.userService.createNewUser(this.username, this.password);
        if (response?.error && response.error === 'Email already in use') {
          this.confirmationText = 'This email is already registered. Please log in or use a different email.';
        } else {
          this.confirmationText = 'We have sent you an email. Open it and click the Confirm Email image to activate your account.';
        }
      } finally {
        this.isCreatingAccount = false;
      }
    } else if (this.accountMode === 'existing') {
      //Logging in with existing account
      const response = await this.userService.loginUser(this.username, this.password);
      if (response?.error) {
        this.confirmationText = response?.error;
      } else {
        this.userService.setUserLoggedIn(true);
        this.userService.setUsername(response?.user.username);
        this.closeLoginDialog();
      }
    }
  }
}
