import { Component } from '@angular/core';
import { ChapterService } from '../../services/chapter.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-chapter',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-chapter.component.html',
  styleUrl: './add-chapter.component.scss'
})
export class AddChapterComponent {
  courseId = 1; // Constant course ID
  chapterForms: any[] = []; // Array to hold multiple chapter forms
  isLoading = false;
  successMessages: string[] = [];
  errorMessages: string[] = [];

  constructor(private chapterService: ChapterService) {}

  addChapterForm(): void {
    this.chapterForms.push({
      title: '',
      description: '',
      type: '',
      isSubmitted: false
    });
  }

  removeChapterForm(index: number): void {
    this.chapterForms.splice(index, 1);
    this.successMessages.splice(index, 1);
    this.errorMessages.splice(index, 1);
  }

  onSubmit(form: NgForm, index: number): void {
    if (form.invalid) {
      this.errorMessages[index] = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    this.errorMessages[index] = '';
    this.successMessages[index] = '';

    const chapterData = {
      title: this.chapterForms[index].title,
      description: this.chapterForms[index].description,
      type: this.chapterForms[index].type
    };

    this.chapterService.createChapter(this.courseId, chapterData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessages[index] = 'Chapter created successfully!';
        this.chapterForms[index].isSubmitted = true;
        console.log('Chapter creation response:', response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessages[index] = error.error?.message || 'Failed to create chapter';
        console.error('Chapter creation failed:', error);
      }
    });
  }
}
