import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseRequestService {
  private baseUrl = 'http://localhost:8081/api/course-requests';
  private coursesBaseUrl = 'http://localhost:8081/api/courses';
  
  constructor(private http: HttpClient) { }
  
  createCourseRequest(requestData: any): Observable<any> {
    return this.http.post(this.baseUrl, requestData).pipe(
      tap(response => console.log('Course request created:', response)),
      catchError(error => {
        console.error('Course request creation failed:', error);
        return throwError(() => error);
      })
    );
  }
  
  getCourseRequests(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      tap(requests => console.log('Fetched course requests:', requests)),
      catchError(error => {
        console.error('Error fetching course requests:', error);
        return throwError(() => error);
      })
    );
  }
  
  getCourseRequestsByStudentId(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/student/${studentId}`).pipe(
      tap(requests => console.log(`Fetched course requests for student ${studentId}:`, requests)),
      catchError(error => {
        console.error(`Error fetching course requests for student ${studentId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  getCourseRequestsByTeacherId(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/teacher/${teacherId}`).pipe(
      tap(requests => console.log(`Fetched course requests for teacher ${teacherId}:`, requests)),
      catchError(error => {
        console.error(`Error fetching course requests for teacher ${teacherId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  updateCourseRequestStatus(requestId: number, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${requestId}/status`, { status }).pipe(
      tap(response => console.log(`Updated course request ${requestId} status to ${status}:`, response)),
      catchError(error => {
        console.error(`Error updating course request ${requestId} status:`, error);
        return throwError(() => error);
      })
    );
  }
  
  acceptCourseRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${requestId}/accept`, {}).pipe(
      tap(response => console.log(`Accepted course request ${requestId}:`, response)),
      catchError(error => {
        console.error(`Error accepting course request ${requestId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  rejectCourseRequest(requestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${requestId}/reject`, {}).pipe(
      tap(response => console.log(`Rejected course request ${requestId}:`, response)),
      catchError(error => {
        console.error(`Error rejecting course request ${requestId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  updateRequestStatusDirectly(requestId: number, status: string): Observable<any> {
    // Format the request body exactly as expected by the API
    const requestBody = {
      "status": status
    };
    
    // Use the correct endpoint URL
    const url = `${this.baseUrl}/${requestId}/status`;
    console.log(`Sending PUT request to: ${url}`);
    console.log('Request body:', JSON.stringify(requestBody));
    
    return this.http.put(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => console.log(`Updated course request ${requestId} to ${status}:`, response)),
      catchError(error => {
        console.error(`Error updating course request ${requestId} to ${status}:`, error);
        console.error('Error details:', error.error);
        return throwError(() => error);
      })
    );
  }
  
  markCourseAsDone(requestId: number): Observable<any> {
    return this.updateRequestStatusDirectly(requestId, 'done');
  }
  
  createCourseFromRequest(requestId: number, teacherId: number, courseData: FormData, categoryIds: number[] = [], tags: string[] = []): Observable<any> {
    let url = `${this.coursesBaseUrl}/request/${requestId}/teacher/${teacherId}`;
    
    // Add query parameters for categories and tags
    if (categoryIds && categoryIds.length > 0) {
      const categoryParams = categoryIds.map(id => `categoryIds=${id}`).join('&');
      url += `?${categoryParams}`;
    }
    
    if (tags && tags.length > 0) {
      const tagParams = tags.map(tag => `tags=${tag}`).join('&');
      url += url.includes('?') ? `&${tagParams}` : `?${tagParams}`;
    }
    
    return this.http.post(url, courseData).pipe(
      tap(response => console.log(`Created course for request ${requestId}:`, response)),
      catchError(error => {
        console.error(`Error creating course for request ${requestId}:`, error);
        return throwError(() => error);
      })
    );
  }
  
  getTeacherRequestCourses(teacherId: number): Observable<any[]> {
    const url = `${this.coursesBaseUrl}/request-teacher/${teacherId}`;
    return this.http.get<any[]>(url).pipe(
      tap(courses => console.log(`Fetched request courses for teacher ${teacherId}:`, courses)),
      catchError(error => {
        console.error(`Error fetching request courses for teacher ${teacherId}:`, error);
        return throwError(() => error);
      })
    );
  }
}