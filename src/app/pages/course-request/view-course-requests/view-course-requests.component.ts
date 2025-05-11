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
import { AuthService } from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
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
  receivedRequests: any[] = [];
  isStudent: boolean = true; // Default to true - everyone can send requests
  isTeacher: boolean = false;
  isLoading: boolean = true;
  currentUserId: number;
  
  constructor(
    private courseRequestService: CourseRequestService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.currentUserId = this.authService.getUserId();
    // Everyone can send requests, so no need for isStudent check
    this.isTeacher = this.authService.isUserTeacher();
  }
  
  ngOnInit(): void {
    this.loadRequests();
  }
  
  loadRequests(): void {
    // Create an array to hold our observables
    const requests = [];
    
    // Always load sent requests - everyone can send requests
    requests.push(
      this.courseRequestService.getCourseRequestsByStudentId(this.currentUserId).pipe(
        catchError(error => {
          console.error('Failed to load sent requests:', error);
          this.snackBar.open('Failed to load sent requests', 'Close', { duration: 3000 });
          return of([]);
        })
      )
    );
    
    // If user is a teacher, also load received requests
    if (this.isTeacher) {
      requests.push(
        this.courseRequestService.getCourseRequestsByTeacherId(this.currentUserId).pipe(
          catchError(error => {
            console.error('Failed to load received requests:', error);
            this.snackBar.open('Failed to load received requests', 'Close', { duration: 3000 });
            return of([]);
          })
        )
      );
    } else {
      // Push an empty array for the second position if user is not a teacher
      requests.push(of([]));
    }
    
    // Execute all requests in parallel
    forkJoin(requests).subscribe({
      next: ([sentData, receivedData]) => {
        this.sentRequests = sentData || [];
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
  
  updateRequestStatus(request: any, newStatus: string): void {
    this.isLoading = true;
    
    this.courseRequestService.updateCourseRequestStatus(request.id, newStatus).subscribe({
      next: (updatedRequest) => {
        // Update the request in our local arrays
        if (this.sentRequests.some(r => r.id === request.id)) {
          const index = this.sentRequests.findIndex(r => r.id === request.id);
          this.sentRequests[index] = { ...this.sentRequests[index], status: newStatus };
        }
        
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: newStatus };
        }
        
        this.snackBar.open(`Request ${newStatus}`, 'Close', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Failed to update request status to ${newStatus}:`, error);
        this.snackBar.open(`Failed to update request status to ${newStatus}`, 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
  
  acceptRequest(request: any): void {
    this.isLoading = true;
    
    this.courseRequestService.acceptCourseRequest(request.id).subscribe({
      next: (result) => {
        // Update the request in our local arrays
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: 'approved' };
        }
        
        this.snackBar.open('Request accepted successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
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
        // Update the request in our local arrays
        if (this.receivedRequests.some(r => r.id === request.id)) {
          const index = this.receivedRequests.findIndex(r => r.id === request.id);
          this.receivedRequests[index] = { ...this.receivedRequests[index], status: 'declined' };
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
  
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'declined':
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
