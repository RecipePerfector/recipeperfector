import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [FormsModule],
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
  }

  submitLogin(): void {
    if (this.usePasswordless) {
      if (this.username.trim()) {
        this.userService.setUserLoggedIn(true);
        this.closeLoginDialog();
      }
      return;
    }

    console.log(this.accountMode);
    if (this.accountMode === 'create') {
      
    }
    /*if (this.username.trim() && this.password.trim()) {
      //WW Do this after logging in
      //this.userService.setUserLoggedIn(true);
      //this.closeLoginDialog();
      console.log(this.accountMode);
    }*/
  }
}
