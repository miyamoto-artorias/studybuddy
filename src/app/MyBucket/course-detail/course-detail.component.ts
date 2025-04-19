import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
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
        this.hasCard = cards && cards.length > 0;
        if (this.hasCard) {
          this.userCard = cards[0]; // Use the first card
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

    const currentUser = this.authService.getCurrentUser();
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
        if (response.status === 'completed') {
          this.paymentStatus = 'completed';
          
          const enrollmentData = {
            userId: currentUser.id,
            courseId: this.course.id
          };

          this.courseService.createEnrollment(enrollmentData).subscribe({
            next: () => {
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

  convertPdfPath(path: string): string {
    return path ? `http://localhost:8081/api/files/${this.extractFileName(path)}` : '';
  }
  
  extractFileName(path: string): string {
    return path.split('\\').pop() || path;
  }
}
