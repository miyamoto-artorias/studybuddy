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
      switchMap(user => this.enrichUserWithCoursesIfTeacher(user)),
      switchMap(user => this.enrichUserWithCards(user)),
      switchMap(user => this.enrichUserWithEnrolledCourses(user)),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  registerStudent(studentData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/students`, studentData).pipe(
      tap(user => this.storeUserData(user)),
      catchError(error => {
        console.error('Student registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  registerTeacher(teacherData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/teachers`, teacherData).pipe(
      tap(user => this.storeUserData(user)),
      catchError(error => {
        console.error('Teacher registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  uploadProfilePicture(file: File): Observable<any> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.baseUrl}/users/${userId}/upload-profile-picture`, formData).pipe(
      tap(response => {
        const user = this.getCurrentUser();
        user.profilePicture = response.profilePicture;
        this.storeUserData(user);
      }),
      catchError(error => {
        console.error('Profile picture upload failed:', error);
        return throwError(() => error);
      })
    );
  }

  getEnrolledCourses(): Observable<any[]> {
    const userId = this.getUserId();
    if (!userId) {
      return of([]);
    }
    return this.http.get<any[]>(`${this.baseUrl}/enrollments/user/${userId}`).pipe(
      tap(enrollments => console.log('Fetched enrollments:', enrollments)),
      switchMap(enrollments => {
        if (!enrollments.length) {
          return of([]);
        }
        
        // Create an object to store enrollment data by courseId for easy lookup
        const enrollmentMap = new Map(
          enrollments.map(enrollment => [enrollment.courseId, enrollment])
        );
        
        // Fetch course details for each enrollment
        const courseRequests = enrollments.map(enrollment => 
          this.http.get(`${this.baseUrl}/courses/${enrollment.courseId}`).pipe(
            // Merge enrollment data (including progress) with course data
            map(course => ({
              ...course,
              // Include progress from enrollment
              progress: enrollmentMap.get(enrollment.courseId)?.progress || 0
            }))
          )
        );
        
        return forkJoin(courseRequests);
      }),
      catchError(error => {
        console.error('Error fetching enrolled courses:', error);
        return of([]);
      })
    );
  }
  
  private storeUserData(user: any): void {
    console.log('Storing user data:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
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

  getTeacherCourses(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/courses/teacher/${teacherId}`).pipe(
      tap(courses => console.log('Fetched teacher courses:', courses)),
      catchError(error => {
        console.error('Error fetching teacher courses:', error);
        throw error;
      })
    );
  }


  getUserCards(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/cards/user/${userId}`).pipe(
      tap(cards => console.log('Fetched user cards:', cards)),
      catchError(error => {
        console.error('Error fetching user cards:', error);
        throw error;
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

  isUserStudent(): boolean {
    const user = this.getCurrentUser();
    return user.userType === 'STUDENT';
  }
  
  isUserTeacher(): boolean {
    const user = this.getCurrentUser();
    return user.userType === 'TEACHER';
  }

  getUserId(): number {
    const user = this.getCurrentUser();
    return user.id || 0;
  }

  getTeacherDetails(teacherId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/teachers/${teacherId}`).pipe(
      tap(teacher => console.log('Fetched teacher details:', teacher)),
      catchError(error => {
        console.error('Error fetching teacher details:', error);
        throw error;
      })
    );
  }

}
