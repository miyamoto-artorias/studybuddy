import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CourseRequestService } from '../../../services/course-request.service';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-teacher-request',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './teacher-request.component.html',
  styleUrl: './teacher-request.component.scss'
})
export class TeacherRequestComponent implements OnInit {
  receivedRequests: any[] = [];
  isLoading: boolean = true;
  currentUserId: number;
  
  constructor(
    private courseRequestService: CourseRequestService,
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.currentUserId = this.authService.getUserId();
    
    // Check if user is a teacher, log a warning if not
    if (!this.authService.isUserTeacher()) {
      console.warn('Non-teacher user accessing teacher requests view');
    }
  }
  
  ngOnInit(): void {
    this.loadRequests();
  }
  
  loadRequests(): void {
    this.isLoading = true;
    
    this.courseRequestService.getCourseRequestsByTeacherId(this.currentUserId)
      .pipe(
        catchError(error => {
          console.error('Failed to load received requests:', error);
          this.snackBar.open('Failed to load received requests', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (receivedData) => {
          this.receivedRequests = receivedData || [];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading course requests:', error);
          this.snackBar.open('Failed to load course requests', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  acceptRequest(request: any): void {
    this.isLoading = true;
    
    this.courseRequestService.acceptCourseRequest(request.id).subscribe({
      next: (result) => {
        // Update the request in our local array using the status from the backend response
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          // Use the status from the backend response if available, otherwise use 'accepted'
          const newStatus = result?.status || 'accepted';
          console.log('New status from backend:', newStatus);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: newStatus };
        }
        
        // Create a course for the approved request
        const courseData = {
          title: request.subject,
          description: "desc",
          picture: "webdev.png",
          price: request.price || 5,
          categoryIds: request.categoryIds || [1, 2]
        };
        
        // Extract category IDs from the request if available
        if (request.categories && request.categories.length > 0) {
          courseData.categoryIds = request.categories.map((cat: any) => cat.id);
        }
        
        this.courseService.createCourseForRequest(request.id, this.currentUserId, courseData).subscribe({
          next: (courseResult) => {
            console.log('Course created for request:', courseResult);
            this.snackBar.open('Request approved and course created successfully', 'Close', { duration: 3000 });
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Failed to create course for request:', error);
            this.snackBar.open('Request approved but failed to create course', 'Close', { duration: 3000 });
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Failed to accept request:', error);
        this.snackBar.open('Failed to accept request', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  rejectRequest(request: any): void {
    this.isLoading = true;
    
    this.courseRequestService.rejectCourseRequest(request.id).subscribe({
      next: (result) => {
        // Update the request in our local array
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          // Use the status from the backend response if available, otherwise use 'rejected'
          const newStatus = result?.status || 'rejected';
          console.log('New status from backend:', newStatus);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: newStatus };
        }
        
        this.snackBar.open('Request rejected', 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to reject request:', error);
        this.snackBar.open('Failed to reject request', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  markRequestAsDone(request: any): void {
    this.isLoading = true;
    
    // Log request details before sending
    console.log('Marking request as done:', request);
    console.log('Request ID:', request.id);
    
    this.courseRequestService.updateRequestStatusDirectly(request.id, 'done').subscribe({
      next: (result) => {
        console.log('Successfully marked request as done, response:', result);
        
        // Update the request in our local array
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: 'done' };
        }
        
        this.snackBar.open('Request marked as done successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        
        // Reload requests to ensure UI is up to date
        this.refreshRequests();
      },
      error: (error) => {
        console.error('Failed to mark request as done:', error);
        console.error('Error details:', error.error || error.message || error);
        
        // Show a more detailed error message
        let errorMessage = 'Failed to mark request as done';
        if (error.error?.message) {
          errorMessage += `: ${error.error.message}`;
        } else if (error.status) {
          errorMessage += ` (Status: ${error.status})`;
        }
        
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }
  
  getStatusClass(status: string): string {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
      case 'accepted':
      case 'completed':
      case 'done':
        return 'status-approved';
      case 'declined':
      case 'rejected':
      case 'cancelled':
        return 'status-declined';
      default:
        return '';
    }
  }
  
  refreshRequests(): void {
    this.isLoading = true;
    this.loadRequests();
  }
}
