import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
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
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
  userCard: any = null;
  isEnrolled = false;
  hasCard = false;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourseDetails(courseId);
    this.checkEnrollmentStatus(courseId);
    this.checkCardStatus();
  }

  loadCourseDetails(courseId: number): void {
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

  checkEnrollmentStatus(courseId: number): void {
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.isEnrolled = courses.some((course: any) => course.id === courseId);
      },
      error: (err) => {
        console.error('Error checking enrollment status:', err);
        this.isEnrolled = false;
      }
    });
  }

  checkCardStatus(): void {
    const userId = this.authService.getUserId();
    this.authService.getUserCards(userId).subscribe({
      next: (cards) => {
        console.log('Cards received:', cards);
        if (Array.isArray(cards)) {
          this.hasCard = cards.length > 0;
          if (this.hasCard) {
            this.userCard = cards[0];
            console.log('Card selected:', this.userCard);
          }
        } else if (cards && typeof cards === 'object') {
          // Handle case where cards is a single object
          this.hasCard = true;
          this.userCard = cards;
          console.log('Single card received:', this.userCard);
        } else {
          this.hasCard = false;
          this.userCard = null;
        }
      },
      error: (err) => {
        console.error('Error checking card status:', err);
        this.hasCard = false;
        this.userCard = null;
      }
    });
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

    const currentUser = this.authService.getCurrentUser();
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
        console.log('Payment response:', response);
        if (response.status === 'completed') {
          this.paymentStatus = 'completed';
          
          // Create enrollment
          const enrollmentData = {
            userId: currentUser.id,
            courseId: this.course.id
          };

          this.courseService.createEnrollment(enrollmentData).subscribe({
            next: (enrollmentResponse) => {
              console.log('Enrollment created:', enrollmentResponse);
              // Update enrollment status
              this.checkEnrollmentStatus(this.course.id);
            },
            error: (enrollmentError) => {
              console.error('Enrollment creation failed:', enrollmentError);
              this.error = 'Payment successful but enrollment failed. Please contact support.';
            }
          });
        } else {
          this.paymentStatus = 'failed';
          this.error = response.message || 'Payment failed. Please try again later.';
        }
      },
      error: (err) => {
        console.error('Payment failed:', err);
        this.paymentStatus = 'failed';
        this.error = err.error?.message || 'Payment failed. Please try again later.';
      }
    });
  }
}
