import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';

@Component({
  selector: 'app-teacher-courses-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './teacher-courses-list.component.html',
  styleUrl: './teacher-courses-list.component.scss'
})
export class TeacherCoursesListComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error: string | null = null;
  teacherId: number | null = null;

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeacherInfo();
  }

  // Get full image URL using the CourseService
  getFullImageUrl(imagePath: string | null): string {
    return this.courseService.getFullImageUrl(imagePath);
  }  private loadTeacherInfo() {
    // Get current user from local storage
    const user = this.authService.getCurrentUser();
    console.log('Current user from local storage:', user);
    
    if (user && user.id) {
      this.teacherId = user.id;
      // Type assertion to avoid null check since we've already confirmed user.id exists
      this.loadTeacherCourses(this.teacherId as number);
    } else {
      console.error('No user ID found in local storage');
      this.error = 'Unable to retrieve teacher information';
      this.loading = false;
    }
  }
  loadTeacherCourses(teacherId: number): void {
    this.loading = true;
    this.error = null;
    
    this.courseService.getTeacherCourses(teacherId).subscribe({
      next: (courses: any[]) => {
        // Process course images
        this.courses = courses.map((course: any) => {
          if (course.picture) {
            course.fullImageUrl = this.courseService.getFullImageUrl(course.picture);
          } else {
            course.fullImageUrl = 'assets/default-course.jpg';
          }
          return course;
        });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading teacher courses:', err);
        this.error = 'Failed to load courses';
        this.loading = false;
        this.courses = [];
      }
    });
  }

  viewCourse(courseId: number): void {
    // Navigate to course details/edit page
    this.router.navigate(['/pages/course', courseId]);
  }

  createNewCourse(): void {
    // Navigate to course creation page
    this.router.navigate(['/pages/course/add']);
  }
}
