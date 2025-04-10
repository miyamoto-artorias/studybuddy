import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private baseUrl = 'http://localhost:8081/api/course-content';

  constructor(private http: HttpClient) {}

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
}