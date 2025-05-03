// teacher-courses.component.ts
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from "../../../../../projects/components/src/icon/icon/icon.component";

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
  showQuizForm = false;

  // Chapter Form
  chapterForm: FormGroup;
  showChapterForm = false;
  
  // Content Form
  contentForm: FormGroup;
  fileToUpload: File | null = null;
  // Quiz Form
  quizForm: FormGroup;

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
    // Initialize quiz form
    this.quizForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      timeLimit: [0, [Validators.required, Validators.min(1)]],
      passingScore: [0, [Validators.required, Validators.min(0)]],
      maxAttempts: [0, [Validators.required, Validators.min(1)]],
      questions: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadTeacherCourses();
  }

  loadTeacherCourses(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.authService.getTeacherCourses(currentUser.id).subscribe({
        next: (courses) => {
          this.teacherCourses = courses;
        },
        error: (err) => {
          console.error('Error loading teacher courses:', err);
          this.teacherCourses = [];
        }
      });
    }
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

    const contentType = this.contentForm.value.type;
    const contentTitle = this.contentForm.value.title;

    if (contentType === 'video' && this.fileToUpload) {
      // Use the uploadVideo method for video uploads
      this.courseService.uploadVideo(this.selectedCourse.id, this.selectedChapter.id, this.fileToUpload, contentTitle)
        .subscribe({
          next: (newContent) => {
            this.selectedChapter.contents = this.selectedChapter.contents || [];
            this.selectedChapter.contents.push(newContent);
            this.updateLocalCourses();
            this.showContentForm = false;
            this.contentForm.reset();
            this.fileToUpload = null;
          },
          error: (err) => {
            console.error('Error uploading video:', err);
            alert('Failed to upload video: ' + (err.error?.message || 'Unknown error'));
          }
        });
    } else if (contentType === 'youtube') {
      // Use the addYouTubeLink method for YouTube links
      const youtubeLinkData = {
        title: contentTitle,
        url: this.contentForm.value.videoUrl
      };

      this.courseService.addYouTubeLink(this.selectedCourse.id, this.selectedChapter.id, youtubeLinkData)
        .subscribe({
          next: (newContent) => {
            this.selectedChapter.contents = this.selectedChapter.contents || [];
            this.selectedChapter.contents.push(newContent);
            this.updateLocalCourses();
            this.showContentForm = false;
            this.contentForm.reset();
          },
          error: (err) => {
            console.error('Error adding YouTube link:', err);
            alert('Failed to add YouTube link: ' + (err.error?.message || 'Unknown error'));
          }
        });
    } else {
      alert('Invalid content type or missing file');
    }
  }

  private updateLocalCourses(): void {
    const index = this.teacherCourses.findIndex(c => c.id === this.selectedCourse.id);
    this.teacherCourses[index] = this.selectedCourse;
    this.loadTeacherCourses(); // Refresh the courses list
  }

  // Helper to access questions form array
  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  // Show quiz form and initialize with one question
  showAddQuizForm(): void {
    this.showQuizForm = true;
    this.quizForm.reset();
    this.questions.clear();
    this.addQuestion();
  }

  // Add a question group
  addQuestion(): void {
    this.questions.push(this.fb.group({
      questionText: ['', Validators.required],
      questionType: ['', Validators.required],
      points: [0, Validators.required],
      optionsString: [''],
      correctAnswersString: ['']
    }));
  }

  // Remove a question group
  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  // Submit new quiz
  addQuiz(): void {
    if (this.quizForm.invalid || !this.selectedChapter) return;
    const formVal = this.quizForm.value;
    const quizData: any = {
      title: formVal.title,
      description: formVal.description,
      timeLimit: formVal.timeLimit,
      passingScore: formVal.passingScore,
      maxAttempts: formVal.maxAttempts,
      questions: formVal.questions.map((q: any) => {
        const question: any = {
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points
        };
        if (q.optionsString) {
          question.options = q.optionsString.split(',').map((opt: string) => opt.trim());
        }
        if (q.questionType === 'SHORT_TEXT' && q.correctAnswersString) {
          question.correctAnswer = q.correctAnswersString.trim();
        } else if (q.questionType.startsWith('MULTIPLE_CHOICE') && q.correctAnswersString) {
          question.correctAnswers = q.correctAnswersString.split(',').map((ans: string) => ans.trim());
        }
        return question;
      })
    };
    this.courseService.createQuiz(this.selectedChapter.id, quizData).subscribe({
      next: (newQuiz) => {
        this.selectedChapter.quizzes = this.selectedChapter.quizzes || [];
        this.selectedChapter.quizzes.push(newQuiz);
        this.updateLocalCourses();
        this.showQuizForm = false;
        this.quizForm.reset();
        this.questions.clear();
      },
      error: (err) => {
        console.error('Error adding quiz:', err);
        alert('Failed to add quiz: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }
}