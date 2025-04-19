import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CourseService } from '../services/course.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CourseDetailComponent implements OnInit {
  course: any = null;
  loading = true;
  error: string | null = null;
  paymentStatus: 'idle' | 'processing' | 'success' | 'error' = 'idle';

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourse(parseInt(courseId));
    }
  }

  loadCourse(courseId: number): void {
    this.loading = true;
    this.error = null;
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        console.log('Course loaded:', course); // Debug log
        this.course = course;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course:', err); // Debug log
        this.error = 'Failed to load course details. Please try again later.';
        this.loading = false;
      }
    });
  }

  purchaseCourse(): void {
    if (!this.course) return;

    console.log('Attempting purchase for course:', this.course); // Debug log
    this.paymentStatus = 'processing';
    
    this.courseService.makePayment(this.course.id, this.course.price).subscribe({
      next: (response) => {
        console.log('Payment successful:', response); // Debug log
        this.paymentStatus = 'success';
        // You might want to redirect to the enrolled courses page or show a success message
      },
      error: (err) => {
        console.error('Payment failed:', err); // Debug log
        this.paymentStatus = 'error';
      }
    });
  }
}
