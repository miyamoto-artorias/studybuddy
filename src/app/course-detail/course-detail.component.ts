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
  userCard: any = null;
  isEnrolled: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {
    // Get user card from localStorage
    const storedCard = localStorage.getItem('userCard');
    if (storedCard) {
      try {
        this.userCard = JSON.parse(storedCard);
      } catch (error) {
        console.error('Error parsing user card:', error);
      }
    }
  }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourse(parseInt(courseId));
      this.checkEnrollment(parseInt(courseId));
    }
  }

  loadCourse(courseId: number): void {
    this.loading = true;
    this.error = null;
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        console.log('Course loaded:', course);
        this.course = course;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.error = 'Failed to load course details. Please try again later.';
        this.loading = false;
      }
    });
  }

  checkEnrollment(courseId: number): void {
    const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
    this.isEnrolled = enrolledCourses.some((course: any) => course.id === courseId);
  }

  purchaseCourse(): void {
    if (this.isEnrolled) {
      this.error = 'You have already purchased this course.';
      return;
    }

    if (!this.course) {
      this.error = 'Course data not available';
      return;
    }

    if (!this.userCard) {
      this.error = 'Payment card not found. Please add a card to make purchases.';
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
      this.error = 'User information not found';
      return;
    }

    if (!this.course.teacher?.id) {
      this.error = 'Teacher information not found';
      return;
    }

    this.paymentStatus = 'processing';
    
    const paymentData = {
      amount: this.course.price,
      payerId: currentUser.id,
      receiverId: this.course.teacher.id,
      courseId: this.course.id,
      cardId: this.userCard.id
    };

    this.courseService.makePayment(paymentData).subscribe({
      next: (response) => {
        console.log('Payment successful:', response);
        this.paymentStatus = 'success';
        this.isEnrolled = true;
        // Update enrolled courses in localStorage
        const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
        enrolledCourses.push(this.course);
        localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
      },
      error: (err) => {
        console.error('Payment failed:', err);
        this.paymentStatus = 'error';
        this.error = err.error?.message || 'Payment failed. Please try again later.';
      }
    });
  }
}
