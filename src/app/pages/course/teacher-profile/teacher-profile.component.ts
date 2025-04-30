import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-profile.component.html',
  styleUrls: ['./teacher-profile.component.scss']
})
export class TeacherProfileComponent implements OnInit {
  teacher: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    const teacherId = Number(this.route.snapshot.paramMap.get('id'));
    if (teacherId) {
      this.loadTeacherDetails(teacherId);
    } else {
      this.error = 'Invalid teacher ID';
      this.loading = false;
    }
  }

  loadTeacherDetails(teacherId: number): void {
    this.loading = true;
    this.error = null;

    this.authService.getTeacherDetails(teacherId).subscribe({
      next: (teacher) => {
        this.teacher = teacher;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading teacher details:', err);
        this.error = 'Failed to load teacher profile';
        this.loading = false;
      }
    });
  }

  formatBalance(balance: number): string {
    return balance.toFixed(2);
  }
} 