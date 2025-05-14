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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
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
    MatBadgeModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './teacher-request.component.html',
  styleUrl: './teacher-request.component.scss'
})
export class TeacherRequestComponent implements OnInit {
  receivedRequests: any[] = [];
  isLoading: boolean = true;
  currentUserId: number;
  openRequestId: number | null = null;
  courseForm: FormGroup;
  categories: any[] = [];
  selectedFile: File | null = null;
  filePreview: string | null = null;
  
  // Track request IDs that already have courses
  requestsWithCourses: Set<number> = new Set<number>();
  
  constructor(
    private courseRequestService: CourseRequestService,
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.currentUserId = this.authService.getUserId();
    
    // Initialize form
    this.courseForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      categoryIds: [[]],
      tags: [''],
    });
    
    // Check if user is a teacher, log a warning if not
    if (!this.authService.isUserTeacher()) {
      console.warn('Non-teacher user accessing teacher requests view');
    }
  }
  
  ngOnInit(): void {
    this.loadRequests();
    this.loadCategories();
    this.loadRequestCourses();
  }
  
  loadCategories(): void {
    this.courseService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
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
  
  loadRequestCourses(): void {
    this.courseRequestService.getTeacherRequestCourses(this.currentUserId).subscribe({
      next: (courses) => {
        // Extract request IDs from courses with courseRequest data
        courses.forEach(course => {
          if (course.courseRequest && course.courseRequest.id) {
            this.requestsWithCourses.add(course.courseRequest.id);
          }
        });
        console.log('Requests with courses:', Array.from(this.requestsWithCourses));
      },
      error: (error) => {
        console.error('Failed to load request courses:', error);
      }
    });
  }
  
  // Check if a course already exists for a request
  hasExistingCourse(requestId: number): boolean {
    return this.requestsWithCourses.has(requestId);
  }
  
  toggleCourseForm(requestId: number): void {
    if (this.openRequestId === requestId) {
      this.openRequestId = null;
    } else {
      this.openRequestId = requestId;
      const request = this.receivedRequests.find(r => r.id === requestId);
      
      // Prefill form with request data
      if (request) {
        this.courseForm.patchValue({
          title: request.subject || '',
          description: request.message || '',
          categoryIds: request.categories?.map((cat: any) => cat.id) || []
        });
      }
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      
      // Create file preview
      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  // Get price for a request
  getRequestPrice(requestId: number | null): number {
    if (!requestId) return 0;
    const request = this.receivedRequests.find(r => r.id === requestId);
    return request ? request.price : 0;
  }
  
  submitCourseForm(): void {
    if (this.courseForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
      return;
    }
    
    if (!this.openRequestId) {
      this.snackBar.open('No request selected', 'Close', { duration: 3000 });
      return;
    }
    
    // Get form values
    const formValues = this.courseForm.value;
    
    // Get current request to ensure we use the correct price
    const request = this.receivedRequests.find(r => r.id === this.openRequestId);
    if (!request) {
      this.snackBar.open('Request not found', 'Close', { duration: 3000 });
      return;
    }
    
    // Create FormData object for multipart/form-data
    const formData = new FormData();
    formData.append('title', formValues.title);
    formData.append('description', formValues.description);
    formData.append('price', request.price.toString()); // Use price from the request
    
    // Add image file if selected
    if (this.selectedFile) {
      formData.append('pictureFile', this.selectedFile);
    }
    
    // Get tags as array
    let tags: string[] = [];
    if (formValues.tags) {
      tags = formValues.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');
    }
    
    this.isLoading = true;
    this.courseRequestService.createCourseFromRequest(
      this.openRequestId, 
      this.currentUserId, 
      formData, 
      formValues.categoryIds,
      tags
    ).subscribe({
      next: (result) => {
        console.log('Course created successfully:', result);
        this.snackBar.open('Course created successfully', 'Close', { duration: 3000 });
        this.resetForm();
        // Mark request as done automatically
        this.markRequestAsDone(this.receivedRequests.find(r => r.id === this.openRequestId));
      },
      error: (error) => {
        console.error('Failed to create course:', error);
        this.snackBar.open('Failed to create course: ' + (error.error?.message || error.message || 'Unknown error'), 'Close', { duration: 5000 });
        this.isLoading = false;
      }
    });
  }
  
  resetForm(): void {
    this.courseForm.reset({
      title: '',
      description: '',
      categoryIds: [],
      tags: ''
    });
    this.selectedFile = null;
    this.filePreview = null;
    this.openRequestId = null;
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
        
        this.snackBar.open('Request approved successfully', 'Close', { duration: 3000 });
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
