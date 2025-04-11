import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    console.log('Initiating login for:', username);

    return this.http.post<any>(`${this.baseUrl}/auth/login`, { username, password }).pipe(
      tap(response => this.storeUserData(response)), // decoupled user storage
      switchMap(response => {
        if (response.userType === 'TEACHER') {
          return this.getTeacherCourses(response.id).pipe(
            map(courses => ({ ...response, courses })),
            catchError(error => {
              console.error('Courses fetch failed:', error);
              return of(response); // Continue even if courses fail
            })
          );
        }
        return of(response);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  storeUserData(user: any): void {
    console.log('Storing user data:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    // You can store more types of user data here if needed
  }

  getTeacherCourses(teacherId?: number): Observable<any> {
    const id = teacherId || this.getUserId();
    if (!id) return of(null);

    return this.http.get(`${this.baseUrl}/courses/teacher/${id}`).pipe(
      tap(courses => {
        console.log('Storing teacher courses:', courses);
        localStorage.setItem('teacherCourses', JSON.stringify(courses));
      })
    );
  }

  logout() {
    console.log('Performing full logout');
    localStorage.clear();
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
}
