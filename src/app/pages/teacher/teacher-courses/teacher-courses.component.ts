// teacher-courses.component.ts
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IconComponent } from "../../../../../projects/components/src/icon/icon/icon.component";
import { ActivatedRoute, Router } from '@angular/router';

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
  quizForm: FormGroup;  constructor(
    private courseService: CourseService,
    private authService: AuthService,
    private fb: FormBuilder,
    public route: ActivatedRoute, // Changed to public for template access
    private router: Router
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
    // Check if there's an ID parameter in the route
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('id');
      
      if (courseId) {
        // If we have a course ID, load just that specific course
        this.loadSingleCourse(parseInt(courseId, 10));
      } else {
        // Otherwise, load all teacher courses (original behavior)
        this.loadTeacherCourses();
      }
    });
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
  
  loadSingleCourse(courseId: number): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        // Set this course as the selected course and add it to the teacher courses array
        console.log('Loaded course details:', course);
        console.log('Original isPublic status:', course.isPublic);
        
        // IMPORTANT: Debug override to test editing
        // Uncomment the line below to force public status for testing
        console.log('Course isPublic status:', course.isPublic);
        this.selectedCourse = course;
        this.teacherCourses = [course];
      },
      error: (err) => {
        console.error('Error loading course:', err);
      }
    });
  }
  selectCourse(course: any): void {
    // If in list mode, navigate to the specific course editing route
    if (!this.route.snapshot.paramMap.get('id')) {
      this.router.navigate(['/pages/course/teachercourses', course.id]);
      return;
    }
    
    // If already in single course mode, just update the selection
    console.log('Selected course for editing:', course);
    console.log('Course isPublic status:', course.isPublic);
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
  console.log('Attempting to show add content form for chapter:', this.selectedChapter?.title);
  console.log('Parent course isPublic status:', this.selectedCourse?.isPublic);
  this.showContentForm = true;
  // Reset form when opening
  this.contentForm.reset();
  this.fileToUpload = null;
}
  
  showAddChapterForm(): void {
    console.log('Attempting to show add chapter form for course:', this.selectedCourse?.title);
    console.log('Course isPublic status:', this.selectedCourse?.isPublic);
    this.showChapterForm = true;
  }
  
  navigateToList(): void {
    // Navigate back to the courses list
    this.router.navigate(['/pages/course/teacher-courses-list']);
  }

  handleFileInput(event: any): void {
    this.fileToUpload = event.target.files[0];
  }

  addChapter(): void {
    if (this.chapterForm.invalid || !this.selectedCourse) return;

    // Debug information about the course
    console.log('Adding chapter to course:', this.selectedCourse);
    console.log('Course isPublic status:', this.selectedCourse.isPublic);
    
    const chapterData = this.chapterForm.value;
    console.log('Chapter data being sent:', chapterData);
    
    this.courseService.createChapter(this.selectedCourse.id, chapterData)
      .subscribe({
        next: (newChapter) => {
          console.log('Successfully added chapter:', newChapter);
          this.selectedCourse.chapters = this.selectedCourse.chapters || [];
          this.selectedCourse.chapters.push(newChapter);
          this.updateLocalCourses();
          this.chapterForm.reset();
          this.showChapterForm = false;
        },
        error: (err) => {
          console.error('Error adding chapter:', err);
          console.error('Error details:', err.error);
          alert('Failed to add chapter: ' + (err.error?.message || 'Unknown error'));
        }
      });
  }

  addContent(): void {
    if (this.contentForm.invalid || !this.selectedChapter) return;

    // Debug information
    console.log('Adding content to chapter:', this.selectedChapter);
    console.log('Parent course isPublic status:', this.selectedCourse?.isPublic);

    const contentType = this.contentForm.value.type;
    const contentTitle = this.contentForm.value.title;
    console.log('Content data:', { type: contentType, title: contentTitle });

    if (contentType === 'video' && this.fileToUpload) {
      // Use the uploadVideo method for video uploads
      console.log('Uploading video file:', this.fileToUpload.name);
      
      this.courseService.uploadVideo(this.selectedCourse.id, this.selectedChapter.id, this.fileToUpload, contentTitle)
        .subscribe({
          next: (newContent) => {
            console.log('Successfully uploaded video:', newContent);
            this.selectedChapter.contents = this.selectedChapter.contents || [];
            this.selectedChapter.contents.push(newContent);
            this.updateLocalCourses();
            this.showContentForm = false;
            this.contentForm.reset();
            this.fileToUpload = null;
          },
          error: (err) => {
            console.error('Error uploading video:', err);
            console.error('Error details:', err.error);
            alert('Failed to upload video: ' + (err.error?.message || 'Unknown error'));
          }
        });
    } else if (contentType === 'youtube') {
      // Use the addYouTubeLink method for YouTube links
      const youtubeLinkData = {
        title: contentTitle,
        url: this.contentForm.value.videoUrl
      };
      console.log('Adding YouTube link:', youtubeLinkData);

      this.courseService.addYouTubeLink(this.selectedCourse.id, this.selectedChapter.id, youtubeLinkData)
        .subscribe({
          next: (newContent) => {
            console.log('Successfully added YouTube link:', newContent);
            this.selectedChapter.contents = this.selectedChapter.contents || [];
            this.selectedChapter.contents.push(newContent);
            this.updateLocalCourses();
            this.showContentForm = false;
            this.contentForm.reset();
          },
          error: (err) => {
            console.error('Error adding YouTube link:', err);
            console.error('Error details:', err.error);
            alert('Failed to add YouTube link: ' + (err.error?.message || 'Unknown error'));
          }
        });
    } else if (contentType === 'pdf' && this.fileToUpload) {
      // Handle PDF upload
      console.log('Uploading PDF file:', this.fileToUpload.name);
      
      this.courseService.uploadContent(this.selectedCourse.id, this.selectedChapter.id, {
        title: contentTitle,
        type: contentType
      }, this.fileToUpload).subscribe({
        next: (newContent) => {
          console.log('Successfully uploaded PDF:', newContent);
          this.selectedChapter.contents = this.selectedChapter.contents || [];
          this.selectedChapter.contents.push(newContent);
          this.updateLocalCourses();
          this.showContentForm = false;
          this.contentForm.reset();
          this.fileToUpload = null;
        },
        error: (err) => {
          console.error('Error uploading PDF:', err);
          console.error('Error details:', err.error);
          alert('Failed to upload PDF: ' + (err.error?.message || 'Unknown error'));
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

  // Helper method to check if we're in single course mode
  isSingleCourseMode(): boolean {
    return !!this.route.snapshot.paramMap.get('id');
  }

  // Add method to toggle course public status
  toggleCoursePublicStatus(): void {
    if (!this.selectedCourse) return;
    
    const newStatus = !this.selectedCourse.isPublic;
    console.log(`Toggling course public status from ${this.selectedCourse.isPublic} to ${newStatus}`);
    
    this.courseService.updateCoursePublicStatus(this.selectedCourse.id, newStatus).subscribe({
      next: (response) => {
        console.log('Course status updated successfully:', response);
        this.selectedCourse.isPublic = newStatus;
        // Update the course in the teacherCourses array as well
        const index = this.teacherCourses.findIndex(c => c.id === this.selectedCourse.id);
        if (index !== -1) {
          this.teacherCourses[index].isPublic = newStatus;
        }
        
        // Refresh the course details to ensure all data is updated
        this.loadSingleCourse(this.selectedCourse.id);
      },
      error: (error) => {
        console.error('Failed to update course public status:', error);
        alert('Failed to update course visibility. Please try again.');
      }
    });
  }
}