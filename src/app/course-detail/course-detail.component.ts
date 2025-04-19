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
    // Debug localStorage
    console.log('Checking localStorage for card...');
    const allKeys = Object.keys(localStorage);
    console.log('All localStorage keys:', allKeys);
    
    // Try different possible keys for the card
    const possibleKeys = ['userCard', 'userCards', 'card'];
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      console.log(`Checking key "${key}":`, value);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          console.log(`Parsed value for key "${key}":`, parsed);
          if (parsed && typeof parsed === 'object' && parsed.id) {
            this.userCard = parsed;
            console.log('Found valid card:', this.userCard);
            break;
          }
        } catch (e) {
          console.error(`Failed to parse value for key "${key}":`, e);
        }
      }
    }

    if (!this.userCard) {
      console.error('No valid card found in localStorage');
      this.error = 'No payment card found. Please add a card to make purchases.';
    } else {
      console.log('Card successfully loaded:', this.userCard);
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
    console.log('Purchase button clicked');
    console.log('Current course:', this.course);
    console.log('User card:', this.userCard);

    if (this.isEnrolled) {
      this.error = 'You have already purchased this course.';
      return;
    }

    if (!this.course) {
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

    console.log('Sending payment data:', paymentData);

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
