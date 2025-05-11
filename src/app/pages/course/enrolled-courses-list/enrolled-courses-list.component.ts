import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-enrolled-courses-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './enrolled-courses-list.component.html',
  styleUrl: './enrolled-courses-list.component.scss'
})
export class EnrolledCoursesListComponent implements OnInit {
  enrolledCourses: any[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadEnrolledCourses();
  }
  loadEnrolledCourses(): void {
    this.isLoading = true;
    this.error = null;
    
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading enrolled courses:', err);
        this.error = 'Failed to load enrolled courses. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  viewCourseDetails(courseId: number): void {
    this.router.navigate(['/courses', courseId]);
  }
}
