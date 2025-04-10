import { Component } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service'; // Add this
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-addcourse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addcourse.component.html',
  styleUrls: ['./addcourse.component.scss']
})
export class AddcourseComponent {
  course = {
    title: '',
    description: '',
    picture: '',
    price: 0
  };
  teacherId = 0;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAuthorized = true;

  constructor(
    private courseService: CourseService,
    private authService: AuthService, // Add this
    private router: Router
  ) {
    // Check authorization on component initialization
    if (!this.authService.isLoggedIn() || !this.authService.isTeacher()) {
      this.isAuthorized = false;
      setTimeout(() => this.router.navigate(['/dashboard']), 3000);
    } else {
      this.teacherId = this.authService.getUserId();
    }
  }

  onSubmit(form: NgForm): void {
    if (!this.isAuthorized) return;

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.courseService.createCourse(this.teacherId, this.course).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Course created successfully!';
        console.log('Course created by teacher ID:', this.teacherId, response);
        
        setTimeout(() => {
          this.successMessage = '';
          this.router.navigate(['/courses']);
        }, 5000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to create course';
        console.error('Course creation failed:', error);
      }
    });
  }
}