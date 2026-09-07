import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-account-menu',
  standalone: true,
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.css'
})
export class AccountMenuComponent {
  private userService = inject(UserService);
  @Output() loggedOut = new EventEmitter<void>();

  get username(): string | null {
    return this.userService.getUsername();
  }

  logout(): void {
    this.loggedOut.emit();
  }
}