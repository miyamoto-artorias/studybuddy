import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CourseRequestService } from '../../../services/course-request.service';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-view-course-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './view-course-requests.component.html',
  styleUrl: './view-course-requests.component.scss'
})
export class ViewCourseRequestsComponent implements OnInit {
  sentRequests: any[] = [];
  isLoading: boolean = true;
  currentUserId: number;
  
  constructor(
    private courseRequestService: CourseRequestService,
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.currentUserId = this.authService.getUserId();
  }
  
  ngOnInit(): void {
    this.loadRequests();
  }
  
  loadRequests(): void {
    this.isLoading = true;
    
    // Load sent requests
    this.courseRequestService.getCourseRequestsByStudentId(this.currentUserId).pipe(
      catchError(error => {
        console.error('Failed to load sent requests:', error);
        this.snackBar.open('Failed to load sent requests', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe({
      next: (sentData) => {
        this.sentRequests = sentData || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course requests:', error);
        this.snackBar.open('Failed to load course requests', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  updateRequestStatus(request: any, newStatus: string): void {
    this.isLoading = true;
    
    this.courseRequestService.updateCourseRequestStatus(request.id, newStatus).subscribe({
      next: (updatedRequest) => {
        // Get the status from the response if available, otherwise use the requested status
        const responseStatus = updatedRequest?.status || newStatus;
        console.log('Status from backend response:', responseStatus);
        
        // Update the request in our local array
        if (this.sentRequests.some(r => r.id === request.id)) {
          const index = this.sentRequests.findIndex(r => r.id === request.id);
          this.sentRequests[index] = { ...this.sentRequests[index], status: responseStatus };
        }
        
        this.snackBar.open(`Request ${responseStatus}`, 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Failed to update request status to ${newStatus}:`, error);
        this.snackBar.open(`Failed to update request status to ${newStatus}`, 'Close', { duration: 3000 });
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
        if (this.sentRequests.some(r => r.id === request.id)) {
          const index = this.sentRequests.findIndex(r => r.id === request.id);
          this.sentRequests[index] = { ...this.sentRequests[index], status: 'done' };
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
