import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})


export class UserService {
  private readonly authTokenStorageKey = 'recipeperfector_auth_token';
  private teamService: { setSelectedTeam: (team: any) => void } | null = null;
  private authToken: string | null;

  loggedIn: boolean = false;

  constructor(private api: ApiService, private router: Router) {
    this.authToken = localStorage.getItem(this.authTokenStorageKey);
  }

  isUserLoggedIn(): boolean {
    if (!this.loggedIn) {
      console.log('Checking localStorage');
      this.loggedIn = localStorage.getItem('loggedIn') === 'true';
    }
    return this.loggedIn;
  }

  setUserLoggedIn(isLoggedIn: boolean): void {
    this.loggedIn = isLoggedIn;
    localStorage.setItem('loggedIn', isLoggedIn.toString());
  }

  getAuthToken(): string | null {
    return this.authToken ?? localStorage.getItem(this.authTokenStorageKey);
  }

  async createNewUser(email: string, password: string): Promise<any>{
    const response = await this.api.callAPIPost('/api/users/register', { email: email, password: password });
    console.log('createNewUser response: ');
    console.log(response);
    return response;
  }

  async confirmUserEmail(email: string, code: string): Promise<any> {
    console.log('Code being sent: ', code);
    const response = await this.api.callAPIPost('/api/users/confirm-email', { email: email, code: code });
    console.log('confirm response: ');
    console.log(response);
    return response;
  }

  async loginUser(email: string, password: string): Promise<any> {
    const response = await this.api.callAPIPost('/api/users/login', { email: email, password: password });
    this.authToken = response?.['token'] ?? null;
    if (this.authToken) {
      localStorage.setItem(this.authTokenStorageKey, this.authToken);
    } else {
      localStorage.removeItem(this.authTokenStorageKey);
    }
    console.log('login response: ');
    console.log(response);
    return response;
  }
}
