// teacher-courses.component.ts
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from "../../../../projects/components/src/icon/icon/icon.component";

@Component({
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  selector: 'app-teacher-courses',
  templateUrl: './teacher-courses.component.html',
  styleUrls: ['./teacher-courses.component.scss']
})
export class TeacherCoursesComponent implements OnInit {
  teacherCourses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  showContentForm = false;

  // Chapter Form
  chapterForm: FormGroup;
  showChapterForm = false;
  
  // Content Form
  contentForm: FormGroup;
  fileToUpload: File | null = null;

  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.chapterForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['', Validators.required]
    });

    this.contentForm = this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      videoUrl: ['']
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
    this.selectedCourse = { ...course };
    this.selectedChapter = null;
    this.showChapterForm = false;
  }

  selectChapter(chapter: any): void {
    this.selectedChapter = { ...chapter };
    this.showContentForm = false; // Reset content form when selecting new chapter
    this.contentForm.reset(); // Clear previous form entries
    this.fileToUpload = null; // Clear any selected files
  }
// Add method to show content form
showAddContentForm(): void {
  this.showContentForm = true;
  // Reset form when opening
  this.contentForm.reset();
  this.fileToUpload = null;
}
  

  showAddChapterForm(): void {
    this.showChapterForm = true;
  }

  handleFileInput(event: any): void {
    this.fileToUpload = event.target.files[0];
  }

  addChapter(): void {
    if (this.chapterForm.invalid || !this.selectedCourse) return;

    this.courseService.createChapter(this.selectedCourse.id, this.chapterForm.value)
      .subscribe({
        next: (newChapter) => {
          this.selectedCourse.chapters = this.selectedCourse.chapters || [];
          this.selectedCourse.chapters.push(newChapter);
          this.updateLocalCourses();
          this.chapterForm.reset();
          this.showChapterForm = false;
        },
        error: (err) => {
          console.error('Error adding chapter:', err);
          alert('Failed to add chapter');
        }
      });
  }

  addContent(): void {
    if (this.contentForm.invalid || !this.selectedChapter) return;
  
    const contentData = {
      title: this.contentForm.value.title,
      type: this.contentForm.value.type,
      ...(this.contentForm.value.type === 'video' ? { 
        content: this.contentForm.value.videoUrl 
      } : {})
    };
  
    const formData = new FormData();
    const contentBlob = new Blob([JSON.stringify(contentData)], { type: 'application/json' });
    formData.append('content', contentBlob, 'content.json');
  
    if (this.contentForm.value.type === 'pdf' && this.fileToUpload) {
      formData.append('file', this.fileToUpload, this.fileToUpload.name);
    }
  
    this.courseService.uploadContent(
      this.selectedCourse.id,
      this.selectedChapter.id,
      contentData,
      this.fileToUpload as File
    ).subscribe({
      next: (newContent) => {
        this.selectedChapter.contents = this.selectedChapter.contents || [];
        this.selectedChapter.contents.push(newContent);
        this.updateLocalCourses();
        this.showContentForm = false; // Close form after success
        this.contentForm.reset();
        this.fileToUpload = null;
      },
      error: (err) => {
        console.error('Error adding content:', err);
        alert('Failed to add content');
        // Keep form open to allow corrections
      }
    });
  }

  private updateLocalCourses(): void {
    const index = this.teacherCourses.findIndex(c => c.id === this.selectedCourse.id);
    this.teacherCourses[index] = this.selectedCourse;
    localStorage.setItem('teacherCourses', JSON.stringify(this.teacherCourses));
    this.loadTeacherCourses();
  }
}