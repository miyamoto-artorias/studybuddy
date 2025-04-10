import { Component } from '@angular/core';
import { CourseService } from '../../services/course.service';
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
  teacherId = 5;  //make sure the userID is of a teacher !!!
  isLoading = false;
  errorMessage = '';
  successMessage = ''; // New property for success message

  constructor(
    private courseService: CourseService,
    private router: Router
  ) {}

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = ''; // Reset success message

    this.courseService.createCourse(this.teacherId, this.course).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Course created successfully!';
        console.log('Course creation response:', response);
        
        // Optional: Auto-clear success message after 5 seconds
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