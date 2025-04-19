import { Component, OnInit } from '@angular/core';
import { CourseService } from '../services/course.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load courses. Please try again later.';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
