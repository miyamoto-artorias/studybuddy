import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import { forkJoin, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, { username, password }).pipe(
      tap(user => this.storeUserData(user)),
      switchMap(user => this.enrichUserWithEnrollments(user)),
      switchMap(user => this.enrichUserWithCoursesIfTeacher(user)),
      switchMap(user => this.enrichUserWithCards(user)),
      switchMap(user => this.enrichUserWithEnrolledCourses(user)),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  getEnrolledCourses(): Observable<any[]> {
    const enrollments = JSON.parse(localStorage.getItem('userEnrollments') || '[]');
    const courseRequests = enrollments.map((enr: any) =>
      this.http.get(`${this.baseUrl}/courses/${enr.courseId}`)
    );
    return courseRequests.length ? forkJoin(courseRequests) as Observable<any[]> : of([]);
  }
  
  private storeUserData(user: any): void {
    console.log('Storing user data:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private enrichUserWithEnrollments(user: any): Observable<any> {
    return this.getUserEnrollments(user.id).pipe(
      map(enrollments => ({ ...user, enrollments })),
      catchError(error => {
        console.error('Enrollment fetch failed:', error);
        return of({ ...user });
      })
    );
  }

  private enrichUserWithCoursesIfTeacher(user: any): Observable<any> {
    if (user.userType === 'TEACHER') {
      return this.getTeacherCourses(user.id).pipe(
        map(courses => ({ ...user, courses })),
        catchError(error => {
          console.error('Courses fetch failed:', error);
          return of({ ...user });
        })
      );
    }
    return of(user);
  }

  private enrichUserWithCards(user: any): Observable<any> {
    return this.getUserCards(user.id).pipe(
      map(cards => ({ ...user, cards })),
      catchError(error => {
        console.error('User cards fetch failed:', error);
        return of({ ...user });
      })
    );
  }

  private enrichUserWithEnrolledCourses(user: any): Observable<any> {
    return this.getEnrolledCourses().pipe(
      map(courses => {
        console.log('Storing enrolled courses:', courses);
        localStorage.setItem('enrolledCourses', JSON.stringify(courses));
        return { ...user, enrolledCourses: courses };
      }),
      catchError(error => {
        console.error('Enrolled courses fetch failed:', error);
        return of({ ...user });
      })
    );
  }

  private getTeacherCourses(teacherId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/courses/teacher/${teacherId}`).pipe(
      tap(courses => {
        console.log('Storing teacher courses:', courses);
        localStorage.setItem('teacherCourses', JSON.stringify(courses));
      })
    );
  }

  private getUserEnrollments(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/enrollments/user/${userId}`).pipe(
      tap(enrollments => {
        console.log('Storing user enrollments:', enrollments);
        localStorage.setItem('userEnrollments', JSON.stringify(enrollments));
      })
    );
  }

  private getUserCards(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/cards/user/${userId}`).pipe(
      tap(cards => {
        console.log('Storing user cards:', cards);
        localStorage.setItem('userCards', JSON.stringify(cards));
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
