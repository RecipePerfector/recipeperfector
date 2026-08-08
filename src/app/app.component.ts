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

    const code = params.get('c');
    const email = params.get('email');

    if (email && code) {
      const response = await this.userService.confirmUserEmail(email, code);
      console.log('Confirm Email Response: ', response);

      if (response.message === 'Email confirmed successfully') {
        this.authShell?.closeLoginDialog();
        this.authShell?.openLoginDialog();
        this.authShell.confirmationText = 'Your account has been created. You may now login to your account.';
      } else if(response.error === 'Email already confirmed') {
        this.authShell?.closeLoginDialog();
        this.authShell?.openLoginDialog();
        this.authShell.confirmationText = 'Your email has already been confirmed. You may now login to your account.';
      }
    }
  }
}