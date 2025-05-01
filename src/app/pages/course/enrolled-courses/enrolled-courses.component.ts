import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { take } from 'rxjs';
import {
  IconComponent,
  TabPanelAsideContentDirective,
  TabPanelAsideComponent,
  TabPanelComponent,
  TabPanelHeaderComponent,
  TabPanelItemComponent,
  TabPanelItemIconDirective,
  TabPanelNavComponent
} from '@elementar-ui/components';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { PdfViewerWrapperComponent } from '../../../pdf-viewer-wrapper/pdf-viewer-wrapper.component';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-enrolled-courses',
  imports: [
    CommonModule,
    IconComponent,
    MatTooltip,
    PdfViewerWrapperComponent,
    TabPanelItemIconDirective,
    TabPanelItemComponent,
    TabPanelAsideContentDirective,
    TabPanelAsideComponent,
    TabPanelNavComponent,
    TabPanelHeaderComponent,
    TabPanelComponent

  ],
  templateUrl: './enrolled-courses.component.html',
  styleUrl: './enrolled-courses.component.scss'
})
export class EnrolledCoursesComponent {
  activeTabId = 'course-1'; // Default to first course
  courses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;
  selectedQuiz: any = null;
  loading = true;
  error: string | null = null;
  // Add new properties for quiz attempts
  quizResponses: { [key: string]: string | string[] } = {};
  attemptInProgress = false;
  quizSubmitted = false;
  quizResult: any = null;
  // Add Object to component
  protected readonly Object = Object;

  constructor(
    private sanitizer: DomSanitizer, 
    private courseService: CourseService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadEnrolledCourses();
  }

  loadEnrolledCourses(): void {
    this.loading = true;
    this.error = null;
    
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        if (this.courses.length) {
          this.selectCourse(this.courses[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading enrolled courses:', err);
        this.error = 'Failed to load enrolled courses';
        this.loading = false;
        this.courses = [];
      }
    });
  }

  selectCourse(course: any): void {
    console.log('Course selected:', course);
    this.selectedCourse = course;
    this.activeTabId = `course-${course.id}`;
    this.selectedChapter = null;
    this.selectedContent = null;
    this.selectedQuiz = null;
    // Clean up any existing Blob URL
    this.revokeBlobUrl();
  }

  selectChapter(chapter: any): void {
    console.log('Chapter selected:', chapter);
    this.selectedChapter = chapter;
    this.selectedQuiz = null;
    // Initialize quizzes array if it doesn't exist
    if (!this.selectedChapter.quizzes) {
      this.selectedChapter.quizzes = [];
    }
    if (chapter.contents && chapter.contents.length) {
      this.selectContent(chapter.contents[0]);
    } else {
      this.selectedContent = null;
      this.revokeBlobUrl();
    }
    // Load quizzes for the selected chapter
    console.log('Loading quizzes for chapter:', chapter.id);
    this.loadChapterQuizzes(chapter.id);
  }

  loadChapterQuizzes(chapterId: number): void {
    console.log('Fetching quizzes for chapter:', chapterId);
    this.courseService.getChapterQuizzes(chapterId).subscribe({
      next: (quizzes) => {
        console.log('Received quizzes:', quizzes);
        this.selectedChapter.quizzes = quizzes;
        // Force change detection by creating a new reference
        this.selectedChapter = { ...this.selectedChapter };
      },
      error: (err) => {
        console.error('Error loading quizzes:', err);
        this.selectedChapter.quizzes = [];
        // Force change detection by creating a new reference
        this.selectedChapter = { ...this.selectedChapter };
      }
    });
  }

  selectContent(content: any): void {
    console.log('Content selected:', content);
    console.log('Selected Course:', this.selectedCourse);
    console.log('Selected Chapter:', this.selectedChapter);
    this.revokeBlobUrl();
    this.selectedContent = { ...content };

    if (content.type === 'pdf') {
      console.log('Processing PDF content');
      const courseId = this.selectedCourse?.id;
      const chapterId = this.selectedChapter?.id;
      const contentId = content?.id;
      
      console.log('Course ID from selectedCourse:', courseId);
      console.log('Chapter ID from selectedChapter:', chapterId);
      console.log('Content ID from content:', contentId);

      if (!courseId || !chapterId || !contentId) {
        console.error('Missing required IDs:', { courseId, chapterId, contentId });
        this.selectedContent = { ...this.selectedContent, error: true };
        return;
      }

      const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/download/${contentId}`;
      console.log('Download URL:', url);
      
      this.courseService.downloadContent(courseId, chapterId, contentId)
        .pipe(take(1))
        .subscribe({
          next: (blob) => {
            console.log('Received blob response:', blob);
            if (blob instanceof Blob) {
              const blobUrl = URL.createObjectURL(blob);
              console.log('Created blob URL:', blobUrl);
              this.selectedContent = {
                ...this.selectedContent,
                downloadUrl: blobUrl,
                error: false
              };
              console.log('Updated selectedContent with blob URL:', this.selectedContent);
            } else {
              console.error('Invalid blob response:', blob);
              this.selectedContent = { ...this.selectedContent, error: true };
            }
          },
          error: (err) => {
            console.error('PDF download failed:', err);
            this.selectedContent = { ...this.selectedContent, error: true };
          }
        });
    }
  }

  selectQuiz(quiz: any): void {
    console.log('Quiz selected:', quiz);
    this.selectedQuiz = quiz;
    this.selectedContent = null;
    this.revokeBlobUrl();
    // Reset quiz state
    this.quizResponses = {};
    this.attemptInProgress = false;
    this.quizSubmitted = false;
    this.quizResult = null;
  }

  isYoutubeLink(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private revokeBlobUrl(): void {
    if (this.selectedContent?.downloadUrl) {
      URL.revokeObjectURL(this.selectedContent.downloadUrl);
      this.selectedContent.downloadUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revokeBlobUrl();
  }

  // Add new methods for quiz functionality
  startQuizAttempt(): void {
    if (!this.selectedChapter || !this.selectedQuiz) return;
    // Just set the attempt in progress without making API call
    this.attemptInProgress = true;
    this.quizResponses = {};
  }

  updateResponse(questionId: number | undefined, response: string, isMultiple: boolean = false): void {
    if (questionId === undefined) {
      console.error('Question ID is undefined');
      return;
    }

    const qId = questionId.toString();
    
    if (isMultiple) {
      // Handle multiple choice answers
      if (!this.quizResponses[qId]) {
        this.quizResponses[qId] = [];
      }
      const responses = this.quizResponses[qId] as string[];
      const index = responses.indexOf(response);
      
      if (index === -1) {
        responses.push(response);
      } else {
        responses.splice(index, 1);
      }
      
      if (responses.length === 0) {
        delete this.quizResponses[qId];
      }
    } else {
      // Handle single choice or text answers
      this.quizResponses[qId] = response;
    }
    
    console.log('Updated responses:', this.quizResponses);
  }

  onTextAnswerChange(event: Event, questionId: number | undefined): void {
    if (questionId === undefined) {
      console.error('Question ID is undefined');
      return;
    }
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateResponse(questionId, target.value);
    }
  }

  onMultipleChoiceChange(event: Event, questionId: number | undefined, option: string): void {
    if (questionId === undefined) {
      console.error('Question ID is undefined');
      return;
    }
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateResponse(questionId, option, true);
    }
  }

  submitQuiz(): void {
    if (!this.selectedChapter || !this.selectedQuiz || !this.attemptInProgress) return;

    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    // Create attempt and submit responses in one call
    this.courseService.submitQuizResponses(
      this.selectedChapter.id,
      this.selectedQuiz.quizId,
      userId,
      this.quizResponses
    ).subscribe({
      next: (result) => {
        console.log('Quiz submitted successfully:', result);
        this.quizSubmitted = true;
        this.quizResult = result;
        this.attemptInProgress = false;
      },
      error: (err) => {
        console.error('Failed to submit quiz:', err);
        // Handle error appropriately
      }
    });
  }
}
