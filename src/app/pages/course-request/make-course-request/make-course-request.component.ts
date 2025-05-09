import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { CourseRequestService } from '../../../services/course-request.service';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-make-course-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './make-course-request.component.html',
  styleUrl: './make-course-request.component.scss'
})
export class MakeCourseRequestComponent implements OnInit {
  courseRequestForm: FormGroup;
  categories: any[] = [];
  teachers: any[] = [];
  isLoading = false;
  isLoadingTeachers = false;
  currentUserId: number;
  
  constructor(
    private fb: FormBuilder,
    private courseRequestService: CourseRequestService,
    private courseService: CourseService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.currentUserId = this.authService.getUserId();
    
    this.courseRequestForm = this.fb.group({
      subject: ['', [Validators.required]],
      teacherId: ['', [Validators.required]],
      categoryIds: [[], [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      message: ['']
    });
  }
  
  ngOnInit(): void {
    // Load categories from API
    this.loadCategories();
    
    // Load teachers from API
    this.loadTeachers();
  }
  
  loadCategories(): void {
    this.courseService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
      }
    });
  }
  
  loadTeachers(): void {
    this.isLoadingTeachers = true;
    this.courseService.getAllTeachers()
      .pipe(finalize(() => this.isLoadingTeachers = false))
      .subscribe({
        next: (teachers) => {
          this.teachers = teachers;
        },
        error: (err) => {
          console.error('Error loading teachers:', err);
          this.snackBar.open('Failed to load teachers', 'Close', { duration: 3000 });
        }
      });
  }
  
  onSubmit(): void {
    if (this.courseRequestForm.valid) {
      this.isLoading = true;
      
      const requestData = {
        studentId: this.currentUserId,
        teacherId: this.courseRequestForm.value.teacherId,
        subject: this.courseRequestForm.value.subject,
        categoryIds: this.courseRequestForm.value.categoryIds,
        price: this.courseRequestForm.value.price,
        status: 'pending',
        message: this.courseRequestForm.value.message
      };
      
      this.courseRequestService.createCourseRequest(requestData).subscribe({
        next: (response) => {
          this.snackBar.open('Course request submitted successfully!', 'Close', { duration: 3000 });
          this.courseRequestForm.reset();
          this.courseRequestForm.patchValue({
            price: 0,
            categoryIds: []
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error submitting course request:', err);
          this.snackBar.open('Failed to submit course request', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } else {
      // Mark all form fields as touched to display validation errors
      Object.keys(this.courseRequestForm.controls).forEach(field => {
        const control = this.courseRequestForm.get(field);
        control?.markAsTouched();
      });
    }
  }
}
