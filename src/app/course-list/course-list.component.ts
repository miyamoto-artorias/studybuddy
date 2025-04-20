import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CourseService } from '../services/course.service';
import { AuthService } from '../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  enrolledCourses: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private courseService: CourseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadEnrolledCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.error = null;
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        // Load categories for each course
        const courseObservables = courses.map(course => 
          this.courseService.getCourseWithCategories(course.id)
        );
        
        forkJoin(courseObservables).subscribe({
          next: (coursesWithCategories) => {
            this.courses = coursesWithCategories;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading courses with categories:', err);
            this.error = 'Failed to load course categories. Please try again later.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.error = 'Failed to load courses. Please try again later.';
        this.loading = false;
      }
    });
  }

  loadEnrolledCourses(): void {
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
      },
      error: (err) => {
        console.error('Error loading enrolled courses:', err);
        this.enrolledCourses = [];
      }
    });
  }

  isEnrolled(courseId: number): boolean {
    return this.enrolledCourses.some(course => course.id === courseId);
  }
}
