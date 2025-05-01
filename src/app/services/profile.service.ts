import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) { }

  getUserDetails(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}`);
  }

  getProfilePicture(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/profile-picture`);
  }
}
