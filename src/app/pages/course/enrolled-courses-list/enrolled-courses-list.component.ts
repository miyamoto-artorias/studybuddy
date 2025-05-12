import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-enrolled-courses-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './enrolled-courses-list.component.html',
  styleUrl: './enrolled-courses-list.component.scss'
})
export class EnrolledCoursesListComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEnrolledCourses();
  }

  loadEnrolledCourses(): void {
    this.loading = true;
    this.error = null;
    
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading enrolled courses:', err);
        this.error = 'Failed to load enrolled courses';
        this.loading = false;
        this.courses = [];
      }
    });
  }

  viewCourse(courseId: number): void {
    this.router.navigate(['/pages/course/enrolled-courses-view', courseId]);
  }

  getProgressPercentage(course: any): number {
    // Use the progress attribute from the enrollment data if available
    if (course.progress !== undefined) {
      return course.progress;
    }
    
    // Fallback to manual calculation if progress attribute is not available
    if (!course.chapters || course.chapters.length === 0) {
      return 0;
    }

    // Calculate completed content items out of total content items
    let totalContents = 0;
    let completedContents = 0;

    course.chapters.forEach((chapter: any) => {
      if (chapter.contents) {
        totalContents += chapter.contents.length;
        chapter.contents.forEach((content: any) => {
          if (content.completed) {
            completedContents++;
          }
        });
      }
    });

    if (totalContents === 0) {
      return 0;
    }

    return Math.round((completedContents / totalContents) * 100);
  }
}
