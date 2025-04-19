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

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {
    // Get user card from localStorage
    const storedCard = localStorage.getItem('userCard');
    console.log('Stored card from localStorage:', storedCard);
    
    if (storedCard) {
      try {
        this.userCard = JSON.parse(storedCard);
        console.log('User card loaded:', this.userCard);
      } catch (error) {
        console.error('Error parsing user card:', error);
        this.error = 'Error loading payment information. Please try again later.';
      }
    } else {
      console.error('No userCard found in localStorage');
      this.error = 'No payment card found. Please add a card to make purchases.';
    }
  }

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

  purchaseCourse(): void {
    console.log('Purchase button clicked');
    console.log('Current course:', this.course);
    console.log('User card:', this.userCard);

    if (!this.course) {
      console.error('No course data available');
      this.error = 'Course data not available';
      return;
    }

    if (!this.userCard) {
      console.error('No user card available');
      this.error = 'Payment card not found. Please add a card to make purchases.';
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log('Current user:', currentUser);

    if (!currentUser.id) {
      console.error('No user ID available');
      this.error = 'User information not found';
      return;
    }

    if (!this.course.teacher?.id) {
      console.error('No teacher ID available');
      this.error = 'Teacher information not found';
      return;
    }

    this.paymentStatus = 'processing';
    
    const paymentData = {
      amount: this.course.price,
      status: "completed",
      payer: { id: currentUser.id },
      receiver: { id: this.course.teacher.id },
      card: { id: this.userCard.id }
    };

    console.log('Sending payment data:', paymentData);

    this.courseService.makePayment(paymentData).subscribe({
      next: (response) => {
        console.log('Payment successful:', response);
        this.paymentStatus = 'success';
      },
      error: (err) => {
        console.error('Payment failed:', err);
        this.paymentStatus = 'error';
        this.error = err.message || 'Payment failed. Please try again later.';
      }
    });
  }
}
