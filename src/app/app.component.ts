import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthShellComponent } from './shared/auth-shell/auth-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AuthShellComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  ngOnInit() {
    const params = new URLSearchParams(window.location.search);

    const emailCode = params.get('emailCode');
    console.log('emailCode: ', emailCode);
  }
}
