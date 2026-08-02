import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiURL: string = 'https://localhost:3000';
  //apiURL: string = 'https://fantasyautoadder-backend-1.onrender.com';
  constructor(private http: HttpClient) { }

  async callAPIPost(endpoint: string, keyMap?: any) {
    const response = await fetch(`${this.apiURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(keyMap ?? {})
    });
    const jsonResponse = await response.json();
    console.log('jr',jsonResponse);
    return jsonResponse;
  }
}
