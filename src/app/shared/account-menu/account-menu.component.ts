import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-account-menu',
  standalone: true,
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.css'
})
export class AccountMenuComponent {
  @Output() loggedOut = new EventEmitter<void>();

  logout(): void {
    this.loggedOut.emit();
  }
}