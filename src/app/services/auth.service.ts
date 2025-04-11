import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private router: Router) {}



  logout() {
    console.log('Logging out user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('teacherCourses');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const loggedIn = !!localStorage.getItem('currentUser');
    console.log('Login status check:', loggedIn);
    return loggedIn;
  }

  getCurrentUser(): any {
    return JSON.parse(localStorage.getItem('currentUser') || '{}');
  }

  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user.userType === 'TEACHER';
  }

  getUserId(): number {
    const user = this.getCurrentUser();
    return user.id || 0;
  }
  login(username: string, password: string) {
    console.log('Attempting login with:', { username, password });
      return this.http.post<any>(`${this.baseUrl}/auth/login`, { username, password })
        .pipe(
          tap(response => {
            console.log('Login API Response:', response);
            localStorage.setItem('currentUser', JSON.stringify(response));
          })
        );
        
    }
  getTeacherCourses(): Observable<any> {
    if (this.isTeacher()) {
      const teacherId = this.getUserId();
      return this.http.get(`${this.baseUrl}/courses/teacher/${teacherId}`).pipe(
        tap(courses => {
          localStorage.setItem('teacherCourses', JSON.stringify(courses));
        })
      );
    } else {
      return of(null);
    }
  }
}