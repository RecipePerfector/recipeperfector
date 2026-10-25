import { Component, inject, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthShellComponent } from './shared/auth-shell/auth-shell.component';
import { UserService } from './services/user/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AuthShellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private userService = inject(UserService);

  @ViewChild(AuthShellComponent) authShell!: AuthShellComponent;

  async ngOnInit() {
    const params = new URLSearchParams(window.location.search);

    const confirm = params.get('c');
    const login = params.get('l');
    const email = params.get('email');
  
    let response;
    if (email && confirm) {
      response = await this.userService.confirmUserEmail(email, confirm);
      console.log('Confirm Email Response: ', response);
    } else if (email && login) {
      response = await this.userService.loginFromEmail(email, login);
    }

    if (response?.message === 'Email confirmed successfully' || 
      response?.message === 'Login success') {
        this.userService.setUserLoggedIn(true);//this.user.getAuthToken()
        this.userService.setUsername(response?.user.username);
        this.userService.setUserId(response?.user.id);
        this.userService.setAuthToken(response?.['token']);

        this.authShell?.closeLoginDialog();
        this.authShell?.openLoginDialog();
        if(response?.message === 'Email confirmed successfully') {
          this.authShell.confirmationText = 'Your account has been created. You have been logged into your account.';
          this.authShell.dialogTitle = 'Confirm Email';
        } else if (response?.message === 'Login success'){
          this.authShell.confirmationText = 'Your account has been logged in successfully.';
          this.authShell.dialogTitle = 'Login';
        }
        
      } else if(response?.error === 'Email already confirmed') {
        this.authShell?.closeLoginDialog();
        this.authShell?.openLoginDialog();
        this.authShell.confirmationText = 'Your email has already been confirmed. You may login to your account.';
        this.authShell.dialogTitle = 'Confirm Email';
      }
  }
}