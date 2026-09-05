import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { Router } from '@angular/router';

@Injectable({providedIn: 'root'})


export class UserService {
  private teamService: { setSelectedTeam: (team: any) => void } | null = null;
  private authToken: string | null = null;

  loggedIn: boolean = false;

  constructor(private api: ApiService, private router: Router) { }

  isUserLoggedIn(): boolean {
    return this.loggedIn;
  }

  setUserLoggedIn(isLoggedIn: boolean): void {
    this.loggedIn = isLoggedIn;
  }

  getAuthToken(): string | null {
    return this.authToken;
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
    console.log('login response: ');
    console.log(response);
    return response;
  }
}
