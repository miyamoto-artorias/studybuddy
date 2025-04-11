import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-enrolled-courses',
  templateUrl: './enrolled-courses.component.html'
})
export class EnrolledCoursesComponent implements OnInit {
  courses: any[] = [];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => this.courses = courses,
      error: (err) => console.error('Failed to load courses:', err)
    });
  }

  viewCourse(courseId: number) {
    this.router.navigate(['/course', courseId]);
  }
}
