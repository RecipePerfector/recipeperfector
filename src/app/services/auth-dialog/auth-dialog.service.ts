import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Lets any page ask the app-wide login dialog (owned by the auth shell) to open,
 * optionally with a message explaining why the user is being asked to log in.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthDialogService {
  private readonly loginRequestedSubject = new Subject<string | undefined>();

  readonly loginRequested$ = this.loginRequestedSubject.asObservable();

  requestLogin(message?: string): void {
    this.loginRequestedSubject.next(message);
  }
}
