import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
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
export class AddcourseComponent implements OnInit {
  course = {
    title: '',
    description: '',
    picture: '',
    price: 0,
    categoryIds: [] as number[],
    tags: [] as string[]
  };
  categories: any[] = [];
  teacherId = 0;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isAuthorized = true;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private router: Router
  ) {
    if (!this.authService.isLoggedIn() || !this.authService.isTeacher()) {
      this.isAuthorized = false;
      setTimeout(() => this.router.navigate(['/dashboard']), 3000);
    } else {
      this.teacherId = this.authService.getUserId();
    }
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.courseService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories';
      }
    });
  }

  toggleCategory(categoryId: number) {
    const index = this.course.categoryIds.indexOf(categoryId);
    if (index === -1) {
      this.course.categoryIds.push(categoryId);
    } else {
      this.course.categoryIds.splice(index, 1);
    }
  }

  onSubmit(form: NgForm): void {
    if (!this.isAuthorized) return;

    if (form.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    if (this.course.categoryIds.length === 0) {
      this.errorMessage = 'Please select at least one category';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Format the course data
    const courseData = {
      title: this.course.title,
      description: this.course.description,
      picture: this.course.picture || 'default-course.png', // Provide a default image if none is specified
      price: Number(this.course.price), // Ensure price is a number
      categoryIds: this.course.categoryIds,
      tags: this.course.tags
    };

    console.log('Submitting course data:', courseData);

    this.courseService.createCourse(this.teacherId, courseData).subscribe({
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

  newTag: string = '';

  addTag(): void {
    if (this.newTag.trim() !== '' && !this.course.tags.includes(this.newTag.trim())) {
      this.course.tags.push(this.newTag.trim());
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.course.tags.indexOf(tag);
    if (index !== -1) {
      this.course.tags.splice(index, 1);
    }
  }
}