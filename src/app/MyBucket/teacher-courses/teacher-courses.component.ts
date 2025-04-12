// teacher-courses.component.ts
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-teacher-courses',
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.scss']
})
export class TeacherCoursesComponent implements OnInit {
  teacherCourses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  addChapterForm: FormGroup;
  addContentForm: FormGroup;
  fileToUpload: File | null = null;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.addChapterForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required]
    });

    this.addContentForm = this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      content: ['']
    });
  }

  ngOnInit(): void {
    this.loadTeacherCourses();
  }

  loadTeacherCourses(): void {
    const storedCourses = localStorage.getItem('teacherCourses');
    this.teacherCourses = storedCourses ? JSON.parse(storedCourses) : [];
  }

  selectCourse(course: any): void {
    this.selectedCourse = course;
    this.selectedChapter = null;
  }

  selectChapter(chapter: any): void {
    this.selectedChapter = chapter;
  }

  handleFileInput(event: any): void {
    this.fileToUpload = event.target.files.item(0);
  }

  addChapter(): void {
    if (this.addChapterForm.invalid || !this.selectedCourse) return;

    const chapterData = this.addChapterForm.value;
    this.courseService.createChapter(this.selectedCourse.id, chapterData)
      .subscribe({
        next: (newChapter) => {
          if (!this.selectedCourse.chapters) this.selectedCourse.chapters = [];
          this.selectedCourse.chapters.push(newChapter);
          this.updateLocalStorage();
          this.addChapterForm.reset();
        },
        error: (err) => console.error('Error adding chapter:', err)
      });
  }

  addContent(): void {
    if (this.addContentForm.invalid || !this.selectedChapter) return;

    const contentData = this.addContentForm.value;
    const formData = new FormData();
    
    // Create content JSON blob
    const contentBlob = new Blob([JSON.stringify({
      title: contentData.title,
      type: contentData.type,
      ...(contentData.type === 'video' ? { content: contentData.content } : {})
    })], { type: 'application/json' });

    formData.append('content', contentBlob, 'content.json');

    if (contentData.type === 'pdf' && this.fileToUpload) {
      formData.append('file', this.fileToUpload, this.fileToUpload.name);
    }

    this.courseService.uploadContent(
      this.selectedCourse.id,
      this.selectedChapter.id,
      contentData,
      this.fileToUpload!
    ).subscribe({
      next: (newContent) => {
        if (!this.selectedChapter.contents) this.selectedChapter.contents = [];
        this.selectedChapter.contents.push(newContent);
        this.updateLocalStorage();
        this.addContentForm.reset();
        this.fileToUpload = null;
      },
      error: (err) => console.error('Error adding content:', err)
    });
  }

  private updateLocalStorage(): void {
    const index = this.teacherCourses.findIndex(c => c.id === this.selectedCourse.id);
    this.teacherCourses[index] = this.selectedCourse;
    localStorage.setItem('teacherCourses', JSON.stringify(this.teacherCourses));
  }
}