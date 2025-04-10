import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private baseUrl = 'http://localhost:8081/api/course-chapters';

  constructor(private http: HttpClient) { }

  createChapter(courseId: number, chapterData: any): Observable<any> {
    const url = `${this.baseUrl}/course/${courseId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(url, chapterData, { headers });
  }
}