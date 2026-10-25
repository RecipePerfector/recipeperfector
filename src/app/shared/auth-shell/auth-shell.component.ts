import { Component, DestroyRef, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecipeButtonComponent } from '../recipe-button/recipe-button.component';
import { AccountMenuComponent } from '../account-menu/account-menu.component';
import { UserService } from '../../services/user/user.service';
import { AuthDialogService } from '../../services/auth-dialog/auth-dialog.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [FormsModule, CommonModule, RecipeButtonComponent, AccountMenuComponent],
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.css'
})
export class AuthShellComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private authDialog = inject(AuthDialogService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('accountMenuContainer', { read: ElementRef })
  private accountMenuContainer?: ElementRef<HTMLElement>;

  isLoginDialogOpen = false;
  username = '';
  password = '';
  accountMode: 'create' | 'existing' = 'existing';
  usePasswordless = false;
  confirmationText = '';
  dialogTitle = 'Sign in';
  isCreatingAccount = false;
  isSigningIn = false;
  userImageUrl = '';
  isAccountMenuOpen = false;
  recipeSearchValue = '';
  /** Explains why the dialog was opened (e.g. a page that requires login). */
  loginPromptText = '';

  constructor() {
    this.authDialog.loginRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        this.openLoginDialog();
        this.loginPromptText = message ?? '';
      });
  }

  get isLoggedIn(): boolean {
    return this.userService.isUserLoggedIn();
  }

  get isHomePage(): boolean {
    return this.router.url.split('?')[0] === '/';
  }

  get isExampleRecipePage(): boolean {
    return this.router.url.split('?')[0] === '/recipe';
  }

  get accountLabel(): string {
    return this.userService.getUsername() ?? 'Account';
  }

  isRecipeSearchInvalid(): boolean {
    const value = this.recipeSearchValue.trim().toLowerCase();
    return value.length > 0 && !value.includes('www.allrecipes.com');
  }

  openLoginDialog(): void {
    this.isLoginDialogOpen = true;
  }

  toggleAccountMenu(): void {
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  openRecipes(): void {
    this.isAccountMenuOpen = false;
    void this.router.navigate(['/recipes']);
  }

  openHome(): void {
    void this.router.navigate(['/']);
  }

  openExampleRecipe(): void {
    void this.router.navigate(['/recipe']);
  }

  @HostListener('document:click', ['$event'])
  closeAccountMenuOnOutsideClick(event: MouseEvent): void {
    if (!this.isAccountMenuOpen || !this.accountMenuContainer) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && !this.accountMenuContainer.nativeElement.contains(target)) {
      this.isAccountMenuOpen = false;
    }
  }

  logout(): void {
    this.userService.logout();
    this.isAccountMenuOpen = false;
    void this.router.navigate(['/']);
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
    this.isAccountMenuOpen = false;
    this.username = '';
    this.password = '';
    this.accountMode = 'existing';
    this.usePasswordless = false;
    this.confirmationText = '';
    this.loginPromptText = '';
    this.isCreatingAccount = false;
    this.isSigningIn = false;
  }

  async submitLogin(): Promise<void> {
    //Creating an account?
    if (this.accountMode === 'create') {
      this.isCreatingAccount = true;
      try {
        const response = await this.userService.createNewUser(this.username, this.password, this.usePasswordless);
        console.log('submit create response: ', response);
        if (response?.error) {
          if(response.error === 'Email already in use') {
            this.confirmationText = 'This email is already registered. Please log in or use a different email.';
            this.dialogTitle = 'Cannot Create Account';
          } else if(response.error === 'email and password are required') {
            if(this.usePasswordless) {
              this.confirmationText = 'An e-mail address is required';
              this.dialogTitle = 'Cannot Create Account';
            } else {
              this.confirmationText = 'An e-mail address and password is required';
              this.dialogTitle = 'Cannot Create Account';
            }
          } else {
            this.confirmationText = response.error;
            this.dialogTitle = 'Unknown Error';
          } 
        } else {
          this.confirmationText = 'We have sent you an email to confirm your account before logging in.';
          this.dialogTitle = 'Action Required';
        }
      } finally {
        this.isCreatingAccount = false;
      }
    } else if (this.accountMode === 'existing') {
       if (this.usePasswordless) {
        const response = await this.userService.loginUserPasswordless(this.username);
        if (response?.error) {
          this.dialogTitle = "An Error Occurred";
          this.confirmationText = response?.error;
        } else {
          //TODO: Implement sending the email
          this.confirmationText = 'If that account exists we have sent it a login email.';
          this.dialogTitle = 'Action Required';
        }
        
        return;
      }
      //Logging in with existing account
      this.isSigningIn = true;
      try {
        const response = await this.userService.loginUser(this.username, this.password);
        if (response?.error) {
          this.dialogTitle = "An Error Occurred";
          this.confirmationText = response?.error;
        } else {
          this.userService.setUserLoggedIn(true);
          this.userService.setUsername(response?.user.username);
          this.userService.setUserId(response?.user.id);
          this.userService.setAuthToken(response.token);
          this.closeLoginDialog();
        }
      } finally {
        this.isSigningIn = false;
      }
    }
  }
}
