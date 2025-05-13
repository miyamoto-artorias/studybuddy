import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
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
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule
  ],
  templateUrl: './view-course-requests.component.html',
  styleUrl: './view-course-requests.component.scss'
})
export class ViewCourseRequestsComponent implements OnInit {
  sentRequests: any[] = [];
  isLoading: boolean = true;
  currentUserId: number;
  
  // Course creation form
  courseForm: FormGroup;
  selectedRequest: any = null;
  showCourseForm: boolean = false;
  fileToUpload: File | null = null;
    constructor(
    private courseRequestService: CourseRequestService,
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.currentUserId = this.authService.getUserId();
    
    // Initialize the course form
    this.courseForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: ['', [Validators.required, Validators.min(1)]],
      pictureFile: ['']
    });
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
  
  acceptRequest(request: any): void {
    // Store the selected request
    this.selectedRequest = request;
    
    // Pre-fill the form with request data
    this.courseForm.patchValue({
      title: request.subject || '',
      description: '',
      price: request.price || 5
    });
    
    // Show the course creation form
    this.showCourseForm = true;
  }
  
  // Method to handle file input
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length) {
      this.fileToUpload = element.files[0];
    }
  }
    // Create course from form
  createCourse(): void {
    if (this.courseForm.invalid || !this.selectedRequest) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
    
    this.isLoading = true;
    
    // First, accept the request
    this.courseRequestService.acceptCourseRequest(this.selectedRequest.id).subscribe({
      next: (result) => {
        const formValue = this.courseForm.value;
        
        // Extract category IDs from the request if available
        const categoryIds = this.selectedRequest.categories?.length > 0 
          ? this.selectedRequest.categories.map((cat: any) => cat.id)
          : [1, 2]; // Default categories if none are provided
        
        // Check if we have a file to upload
        if (this.fileToUpload) {
          // Use FormData for file uploads
          const formData = new FormData();
          formData.append('title', formValue.title);
          formData.append('description', formValue.description);
          formData.append('price', formValue.price);
          formData.append('pictureFile', this.fileToUpload, this.fileToUpload.name);
          
          // Use createCourseWithImage for FormData
          this.courseService.createCourseWithImage(
            this.currentUserId, 
            formData
          ).subscribe({
            next: (courseResult) => {
              console.log('Course created for request with image:', courseResult);
              this.snackBar.open('Request approved and course created successfully', 'Close', { duration: 3000 });
              
              // Update the request in our local array
              this.updateLocalRequestStatus(this.selectedRequest!.id, 'accepted');
              
              // Reset form and state
              this.resetFormState();
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Failed to create course with image:', error);
              this.snackBar.open('Request approved but failed to create course', 'Close', { duration: 3000 });
              this.isLoading = false;
              this.resetFormState();
            }
          });
        } else {
          // Create regular course data object without file
          const courseData = {
            title: formValue.title,
            description: formValue.description,
            price: formValue.price || 5,
            picture: "default-course.jpg", // Default image
            categoryIds: categoryIds
          };
          
          // Create course using the JSON data
          this.courseService.createCourseForRequest(
            this.selectedRequest!.id, 
            this.currentUserId, 
            courseData
          ).subscribe({
            next: (courseResult) => {
              console.log('Course created for request:', courseResult);
              this.snackBar.open('Request approved and course created successfully', 'Close', { duration: 3000 });
              
              // Update the request in our local array
              this.updateLocalRequestStatus(this.selectedRequest!.id, 'accepted');
              
              // Reset form and state
              this.resetFormState();
              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Failed to create course for request:', error);
              this.snackBar.open('Request approved but failed to create course', 'Close', { duration: 3000 });
              this.isLoading = false;
              this.resetFormState();
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Failed to accept request:', error);
        this.snackBar.open('Failed to accept request', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.resetFormState();
      }
    });
  }
  
  // Helper method to update local request status
  updateLocalRequestStatus(requestId: number, status: string): void {
    if (this.sentRequests.some(r => r.id === requestId)) {
      const index = this.sentRequests.findIndex(r => r.id === requestId);
      this.sentRequests[index] = { ...this.sentRequests[index], status: status };
    }
  }
  
  // Reset form and state
  resetFormState(): void {
    this.courseForm.reset();
    this.selectedRequest = null;
    this.showCourseForm = false;
    this.fileToUpload = null;
  }
  
  // Cancel form submission
  cancelForm(): void {
    this.resetFormState();
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
