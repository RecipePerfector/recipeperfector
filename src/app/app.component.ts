import { Component, inject } from '@angular/core';
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

  async ngOnInit() {
    const params = new URLSearchParams(window.location.search);

    const code = params.get('c');
    const email = params.get('email');
    console.log('c: ', code);
    console.log('email: ', email);

    if(email && code){
      const response = await this.userService.confirmUserEmail(email, code);
      console.log('Confirm Email Response: ', response);
    }
  }
}
