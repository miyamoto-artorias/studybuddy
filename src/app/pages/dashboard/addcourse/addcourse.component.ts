import { Component } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-addcourse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addcourse.component.html',
  styleUrls: ['./addcourse.component.scss']
})
export class AddcourseComponent {
  courseId = 1;
  chapterId = 1;
  title = '';
  type = 'pdf';
  file: File | null = null;
  types = ['pdf', 'video'];

  constructor(private contentService: CourseService) {}

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      console.log('File selected:', this.file.name);
    }
  }

  onSubmit(): void {
    console.log('Form submitted');
    if (!this.file || !this.title || !this.type) {
      console.error('All fields are required');
      return;
    }

    const content = { title: this.title, type: this.type };
    console.log('Uploading:', content, this.file.name);
    this.contentService.uploadContent(this.courseId, this.chapterId, content, this.file)
      .subscribe({
        next: (response) => {
          console.log('Upload successful', response);
          this.title = '';
          this.type = 'pdf';
          this.file = null;
        },
        error: (error) => {
          console.error('Upload failed', error);
        },
        complete: () => console.log('Request completed')
      });
  }
}