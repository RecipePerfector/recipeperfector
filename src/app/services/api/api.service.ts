import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  apiURL: string = 'https://localhost:3000';
  //apiURL: string = 'https://fantasyautoadder-backend-1.onrender.com';
  constructor(private http: HttpClient) { }

  callAPIGet(endpoint : string, keyMap?: any) {
    const headers = new HttpHeaders()
    //.set('Authorization', 'my-auth-token')
    .set('Content-Type', 'application/json');

    if(keyMap) {
      //'/getuser?code=' + code
      endpoint = endpoint + '?';
      let firstKey = true;
      for (const key in keyMap) {
        if(firstKey) {
          endpoint = endpoint + key + '=' + keyMap[key];
          firstKey = false;
        } else {
          endpoint = endpoint + '&' + key + '=' + keyMap[key];
        firstKey = false;
        }
        

      }
    }
    return this.http.get(this.apiURL + endpoint, {
      headers: headers,
      withCredentials: true
    }).toPromise();
  }
}
