import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(
      'http://localhost:8081/api/auth/login', 
      { username, password }
    ).pipe(
      tap(response => {
        localStorage.setItem('currentUser', JSON.stringify(response));
      })
    );
  }

  logout() {
    // Clear any stored user data
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    // Check if user data exists in localStorage
    return !!localStorage.getItem('currentUser');
  }
}