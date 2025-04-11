import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-detail',
  imports: [CommonModule],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.scss'
})
export class CourseDetailComponent {
  course: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    this.http.get(`http://localhost:8081/api/courses/${courseId}`).subscribe({
      next: course => this.course = course,
      error: err => console.error('Course load failed', err)
    });
  }
  convertPdfPath(path: string): string {
    // Adapt this logic depending on how your backend exposes files
    return path ? `http://localhost:8081/api/files/${this.extractFileName(path)}` : '';
  }
  
  extractFileName(path: string): string {
    return path.split('\\').pop() || path;
  }
  
}
