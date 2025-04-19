import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:8081/api/course-content';
  private coursesbaseUrl = 'http://localhost:8081/api/courses';

  // In AuthService
  downloadContent(courseId: number, chapterId: number, contentId: number): Observable<Blob> {
    const url = `${this.baseUrl}/course/${courseId}/chapter/${chapterId}/download/${contentId}`;
    return this.http.get(url, { responseType: 'blob' });
  }
  

  createCourse(teacherId: number, courseData: any): Observable<any> {
    const url = `${this.coursesbaseUrl}/${teacherId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
  
    return this.http.post(url, courseData, { headers }).pipe(
      tap(response => {
        console.log('Course created successfully:', response);
        // Refresh teacher courses after creation
        this.http.get(`${this.coursesbaseUrl}/teacher/${teacherId}`).pipe(
          tap(courses => {
            console.log('Updated teacher courses:', courses);
            // Update localStorage directly
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (currentUser.userType === 'TEACHER') {
              localStorage.setItem('teacherCourses', JSON.stringify(courses));
              // Also update the current user object in storage
              localStorage.setItem('currentUser', JSON.stringify({
                ...currentUser,
                courses
              }));
            }
          })
        ).subscribe();
      }),
      catchError(error => {
        console.error('Course creation failed:', error);
        throw error;
      })
    );
  }


  uploadContent(courseId: number, chapterId: number, content: { title: string; type: string }, file: File): Observable<any> {
    const formData = new FormData();
    const contentBlob = new Blob([JSON.stringify(content)], { type: 'application/json' });
 formData.append('content', contentBlob, 'content.json');
    formData.append('file', file, file.name);

    const url = `${this.baseUrl}/course/${courseId}/chapter/${chapterId}`;
    const headers = new HttpHeaders({
      'Authorization': 'Basic ' + btoa('admin:1234') // Base64 encode username:password
    });

    console.log('Sending request to:', url, 'File:', file.name);
    return this.http.post(url, formData, { headers }).pipe(
      tap(response => console.log('Response:', response)),
      catchError(error => {
        console.error('Request failed:', error);
        throw error;
      })
    );
  }

  // Add to CourseService

// Add to CourseService
createChapter(courseId: number, chapterData: any): Observable<any> {
  return this.http.post(
    `http://localhost:8081/api/course-chapters/course/${courseId}`,
    chapterData
  ).pipe(
    tap(response => console.log('Chapter created:', response)),
    catchError(error => {
      console.error('Chapter creation failed:', error);
      throw error;
    })
  );
}

getAllCourses(): Observable<any[]> {
  return this.http.get<any[]>(`${this.coursesbaseUrl}`).pipe(
    tap(courses => console.log('Fetched courses:', courses)),
    catchError(error => {
      console.error('Error fetching courses:', error);
      throw error;
    })
  );
}

getCourseById(courseId: number): Observable<any> {
  console.log('Fetching course with ID:', courseId);
  return this.http.get<any>(`${this.coursesbaseUrl}/${courseId}`).pipe(
    tap(course => console.log('Fetched course:', course)),
    catchError(error => {
      console.error('Error fetching course:', error);
      throw error;
    })
  );
}

makePayment(paymentData: {
  amount: number;
  status: string;
  payer: { id: number };
  receiver: { id: number };
  card: { id: number };
}): Observable<any> {
  return this.http.post('http://localhost:8081/api/payments', paymentData).pipe(
    tap(response => console.log('Payment successful:', response)),
    catchError(error => {
      console.error('Payment failed:', error);
      throw error;
    })
  );
}
}