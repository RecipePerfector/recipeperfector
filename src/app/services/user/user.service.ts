import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})


export class UserService {
  private readonly authTokenStorageKey = 'recipeperfector_auth_token';
  private teamService: { setSelectedTeam: (team: any) => void } | null = null;
  private authToken: string | null;

  loggedIn: boolean = false;
  username: string | null = null;
  userId: string | null = null;

  constructor(private api: ApiService, private router: Router) {
    this.authToken = localStorage.getItem(this.authTokenStorageKey);
    this.username = localStorage.getItem('username');
    this.userId = localStorage.getItem('userId');
  }

  isUserLoggedIn(): boolean {
    if (!this.loggedIn) {
      this.loggedIn = localStorage.getItem('loggedIn') === 'true';
    }
    return this.loggedIn;
  }

  setUserLoggedIn(isLoggedIn: boolean): void {
    this.loggedIn = isLoggedIn;
    localStorage.setItem('loggedIn', isLoggedIn.toString());
  }

  setUsername(username: string): void {
    this.username = username;
    localStorage.setItem('username', username);
  }

  setUserId(userId: string): void {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  getUsername(): string | null {
    return this.username;
  }

  getUserId(): string | null {
    return this.userId;
  }

  logout(): void {
    this.loggedIn = false;
    this.authToken = null;
    this.username = null;
    localStorage.removeItem('loggedIn');
    localStorage.removeItem(this.authTokenStorageKey);
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  }

  setAuthToken(authToken: string): void {
    this.authToken = authToken;
    
    if(! authToken) {
      localStorage.removeItem(this.authTokenStorageKey);
    } else {
      localStorage.setItem(this.authTokenStorageKey, authToken);
    }
  }

  getAuthToken(): string | null {
    return this.authToken ?? localStorage.getItem(this.authTokenStorageKey);
  }

  async createNewUser(email: string, password: string, passwordless: boolean): Promise<any>{
    const response = await this.api.callAPIPost('/api/users/register', { email: email, password: password, passwordless: passwordless });
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
    
    console.log('login response: ');
    console.log(response);
    return response;
  }

  async loginUserPasswordless(email: string): Promise<any> {
    const response = await this.api.callAPIPost('/api/users/loginPasswordless', { email: email});
    this.setAuthToken(response?.['token']);
    
    console.log('login passwordless response: ');
    console.log(response);
    return response;
  }
}
