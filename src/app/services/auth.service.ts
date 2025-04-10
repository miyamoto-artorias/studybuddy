import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    console.log('Attempting login with:', { username, password });
    return this.http.post<any>(`${this.baseUrl}/auth/login`, { username, password })
      .pipe(
        tap(response => console.log('Login API Response:', response))
      );
  }

  logout() {
    console.log('Logging out user');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const loggedIn = !!localStorage.getItem('currentUser');
    console.log('Login status check:', loggedIn);
    return loggedIn;
  }
}