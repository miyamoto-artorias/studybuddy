import { Component, OnInit, OnDestroy, ViewChild, ElementRef, PLATFORM_ID, Inject, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
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
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AiService } from '../../../services/ai.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { PdfViewerWrapperComponent } from './pdf-viewer-wrapper/pdf-viewer-wrapper.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { Subscription, Subject, of, forkJoin } from 'rxjs';

export interface QuizQuestion {
  questionId?: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTIPLE' | 'TRUE_FALSE' | 'SHORT_TEXT' | 'ESSAY' | 'MATCHING' | 'ORDERING';
  options?: string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  points: number;
  matchingPairs?: {[key: string]: string};
  orderingSequence?: string[];
}

export interface Quiz {
  quizId?: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number; 
  passingScore: number;
  maxAttempts: number;
  status?: string; 
  createdAt?: Date;
  updatedAt?: Date;
}

// Import PDF.js conditionally
let pdfjs: any = null;
if (typeof window !== 'undefined') {
  // We're in browser environment - dynamically import PDF.js
  import('pdfjs-dist').then(pdf => {
    pdfjs = pdf;
    const pdfjsLib = pdfjs;
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  });
}

@Component({
  selector: 'app-enrolled-course-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    MatTooltip,
    PdfViewerWrapperComponent,
    TabPanelItemIconDirective,
    TabPanelItemComponent,
    TabPanelAsideContentDirective,
    TabPanelAsideComponent,
    TabPanelNavComponent,
    TabPanelHeaderComponent,
    TabPanelComponent,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './enrolled-course-view.component.html',
  styleUrl: './enrolled-course-view.component.scss'
})
export class EnrolledCourseViewComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;

  courseId: number = 0;
  course: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;
  selectedQuiz: any = null;
  loading = true;
  error: string | null = null;
  isBrowser: boolean;
  // Enrollment ID for the current course
  enrollmentId: number | null = null;

  // Add new properties for quiz attempts
  quizResponses: { [key: string]: string } = {};
  multiChoiceSelections: { [key: string]: Set<string> } = {};
  attemptInProgress = false;
  quizSubmitted = false;
  quizResult: any = null;
  // Add Object to component
  protected readonly Object = Object;

  // AI Quiz Generation properties
  showAIQuizGenerator = false;
  generatingAIQuiz = false;
  aiQuizPrompt: string = '';
  generatedAIQuiz: Quiz | null = null;
  aiQuizUserResponses: {[questionId: number]: string | string[]} = {};
  aiQuizErrorMessage: string = '';

  // PDF Summarization properties
  showPdfSummary = false;
  generatingSummary = false;
  pdfSummaryContent: string = '';
  pdfSummaryHtml: SafeHtml = '';
  pdfBlob: Blob | null = null;

  private destroy$ = new Subject<void>();
  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer, 
    private courseService: CourseService,
    private authService: AuthService,
    private http: HttpClient,
    private aiService: AiService,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadCourse();
    this.loadEnrollmentId();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
    this.revokeBlobUrl();
  }

  loadCourse(): void {
    this.loading = true;
    this.error = null;
    
    this.subscription.add(
      this.route.paramMap.pipe(
        takeUntil(this.destroy$),
        filter(params => !!params.get('id')),
        switchMap(params => {
          const id = params.get('id');
          if (id) {
            this.courseId = +id;
            // First try getting the course from enrolled courses
            return this.authService.getEnrolledCourses().pipe(
              switchMap(courses => {
                const enrolledCourse = courses.find(c => c.id === this.courseId);
                if (enrolledCourse) {
                  return of(enrolledCourse);
                } else {
                  // Fallback to getting the course directly
                  return this.courseService.getCourseById(this.courseId);
                }
              }),
              catchError(err => {
                console.error('Error loading course:', err);
                this.error = 'Failed to load course';
                return of(null);
              })
            );
          }
          this.error = 'Course ID not provided';
          return of(null);
        })
      ).subscribe({
        next: (course) => {
          this.course = course;
          console.log('Loaded course:', this.course);
          
          if (this.course && this.course.chapters && this.course.chapters.length > 0) {
            this.selectChapter(this.course.chapters[0]);
          } else {
            console.error('Course has no chapters');
            this.error = 'This course has no content yet';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Subscription error:', err);
          this.error = 'Failed to load course';
          this.loading = false;
        }
      })
    );
  }

  // Load the enrollment ID for the current user and course
  loadEnrollmentId(): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      filter(params => !!params.get('id')),
      switchMap(params => {
        const courseId = params.get('id');
        if (!courseId) return of(null);
        return this.http.get<any[]>(`http://localhost:8081/api/enrollments/user/${userId}`);
      })
    ).subscribe({
      next: (enrollments) => {
        if (enrollments) {
          const enrollment = enrollments.find(e => e.courseId === this.courseId);
          if (enrollment) {
            this.enrollmentId = enrollment.id;
            console.log('Found enrollment ID:', this.enrollmentId);
          }
        }
      },
      error: (err) => {
        console.error('Error loading enrollment:', err);
      }
    });
  }

  // Get the current user ID from localStorage
  getUserId(): number {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id || 0;
  }

  selectChapter(chapter: any): void {
    console.log('Selecting chapter:', chapter);
    this.selectedChapter = chapter;
    this.selectedQuiz = null;
    this.resetAIQuiz();
    this.resetPdfSummary();
    this.revokeBlobUrl();
    
    // Initialize quizzes array if it doesn't exist
    if (!this.selectedChapter.quizzes) {
      this.selectedChapter.quizzes = [];
      // Load quizzes for the selected chapter
      this.loadChapterQuizzes(chapter.id);
    }
    
    // Auto-select first content if available
    if (chapter.contents && chapter.contents.length > 0) {
      // Check completion status for all contents in this chapter
      this.loadContentCompletionStatus(chapter.contents);
      this.selectContent(chapter.contents[0]);
    } else {
      this.selectedContent = null;
    }
  }

  loadChapterQuizzes(chapterId: number): void {
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
      }
    });
  }

  // Load completion status for an array of contents
  loadContentCompletionStatus(contents: any[]): void {
    const userId = this.getUserId();
    if (!userId || !this.enrollmentId) return;

    // Create a batch of requests to check status of each content
    const statusRequests = contents.map(content => 
      this.http.get<any>(`http://localhost:8081/api/progress/user/${userId}/content/${content.id}/enrollment/${this.enrollmentId}/status`)
        .pipe(
          catchError(error => {
            // On error, assume content is not completed
            console.error(`Error checking completion status for content ${content.id}:`, error);
            return of({ completed: false });
          })
        )
    );

    // Execute all requests and update content objects
    forkJoin(statusRequests).subscribe(results => {
      contents.forEach((content, index) => {
        content.completed = results[index]?.completed || false;
      });
      // Force change detection
      this.selectedChapter = { ...this.selectedChapter };
    });
  }

  // Check completion status for a single content
  checkContentCompletionStatus(content: any): void {
    const userId = this.getUserId();
    if (!userId || !this.enrollmentId) return;

    this.http.get<any>(`http://localhost:8081/api/progress/user/${userId}/content/${content.id}/enrollment/${this.enrollmentId}/status`)
      .pipe(
        catchError(error => {
          console.error(`Error checking completion status for content ${content.id}:`, error);
          return of({ completed: false });
        })
      )
      .subscribe(status => {
        content.completed = status.completed || false;
        // If this is the currently selected content, update it
        if (this.selectedContent && this.selectedContent.id === content.id) {
          this.selectedContent = { ...this.selectedContent, completed: content.completed };
        }
      });
  }

  // Toggle content completion status
  toggleContentCompletion(content: any, event: Event): void {
    // Prevent the click from triggering the selectContent function
    event.stopPropagation();
    
    const userId = this.getUserId();
    if (!userId || !this.enrollmentId) {
      this.showNotification('User or enrollment information is missing');
      return;
    }

    const url = content.completed
      ? `http://localhost:8081/api/progress/user/${userId}/content/${content.id}/enrollment/${this.enrollmentId}/uncomplete`
      : `http://localhost:8081/api/progress/user/${userId}/content/${content.id}/enrollment/${this.enrollmentId}/complete`;

    this.http.post(url, {}).subscribe({
      next: () => {
        // Update the local content state
        content.completed = !content.completed;
        this.showNotification(content.completed 
          ? `${content.title} marked as completed`
          : `${content.title} marked as incomplete`);
        
        // If this is the currently selected content, update it
        if (this.selectedContent && this.selectedContent.id === content.id) {
          this.selectedContent = { ...this.selectedContent, completed: content.completed };
        }
      },
      error: (err) => {
        console.error('Error toggling content completion:', err);
        this.showNotification('Failed to update content status');
      }
    });
  }

  selectContent(content: any): void {
    console.log('Content selected:', content);
    this.revokeBlobUrl();
    this.selectedContent = { ...content };
    this.selectedQuiz = null;
    this.resetAIQuiz();
    this.resetPdfSummary();

    // Check content completion status
    this.checkContentCompletionStatus(content);

    if (content.type === 'pdf') {
      this.loadPdfContent(content);
    } else if (content.type === 'video') {
      this.loadVideoContent(content);
    }
  }

  loadPdfContent(content: any): void {
    if (!this.isBrowser) return;
    
    console.log('Loading PDF content');
    const courseId = this.courseId;
    const chapterId = this.selectedChapter?.id;
    const contentId = content?.id;
    
    if (!courseId || !chapterId || !contentId) {
      console.error('Missing required IDs:', { courseId, chapterId, contentId });
      this.selectedContent = { ...this.selectedContent, error: true };
      return;
    }

    this.courseService.downloadContent(courseId, chapterId, contentId)
      .pipe(take(1))
      .subscribe({
        next: (blob) => {
          if (blob instanceof Blob) {
            console.log('PDF blob received, size:', blob.size, 'type:', blob.type);
            
            // Store the blob reference but don't try to extract text
            this.pdfBlob = blob;
            
            const blobUrl = URL.createObjectURL(blob);
            this.selectedContent = {
              ...this.selectedContent,
              downloadUrl: blobUrl,
              error: false
            };
            
            // Skip actual PDF text extraction check
            console.log('PDF loaded successfully - summary will use mock data when requested');
          } else {
            console.error('Invalid blob response');
            this.selectedContent = { ...this.selectedContent, error: true };
            this.showNotification('Failed to load PDF');
          }
        },
        error: (err) => {
          console.error('PDF download failed:', err);
          this.selectedContent = { ...this.selectedContent, error: true };
          this.showNotification('Failed to load PDF');
        }
      });
  }

  validatePdfForSummarization(blob: Blob): void {
    // We're now using mock summaries, so no need to validate extraction capability
    console.log('PDF validation skipped - using mock summaries');
  }

  testPdfExtraction(blob: Blob): void {
    // We're now using mock summaries, so no actual extraction test needed
    console.log('PDF extraction test skipped - using mock summaries');
  }

  loadVideoContent(content: any): void {
    if (!this.isBrowser) return;
    
    console.log('Loading video content');
    if (this.isYoutubeLink(content.content)) {
      console.log('YouTube video detected');
      return; // YouTube videos are handled directly in the template
    }
    
    const courseId = this.courseId;
    const chapterId = this.selectedChapter?.id;
    const contentId = content?.id;

    if (!courseId || !chapterId || !contentId) {
      console.error('Missing required IDs');
      this.selectedContent = { ...this.selectedContent, error: true };
      return;
    }

    this.streamVideo(courseId, chapterId, contentId);
  }

  streamVideo(courseId: number, chapterId: number, contentId: number): void {
    const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/stream-video/${contentId}`;
    
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        if (this.videoPlayer && this.videoPlayer.nativeElement) {
          const videoUrl = URL.createObjectURL(blob);
          this.videoPlayer.nativeElement.src = videoUrl;
          this.videoPlayer.nativeElement.load();
          this.videoPlayer.nativeElement.play();
        }
      },
      error: (error) => {
        console.error('Video stream failed:', error);
        this.showNotification('Failed to load video');
      }
    });
  }

  selectQuiz(quiz: any): void {
    console.log('Quiz selected:', quiz);
    this.selectedQuiz = quiz;
    this.selectedContent = null;
    this.revokeBlobUrl();
    this.resetAIQuiz();
    this.resetPdfSummary();
    
    // Reset quiz state
    this.quizResponses = {};
    this.attemptInProgress = false;
    this.quizSubmitted = false;
    this.quizResult = null;
  }

  startQuizAttempt(): void {
    if (!this.selectedChapter || !this.selectedQuiz) return;
    this.attemptInProgress = true;
    this.quizResponses = {};
    this.multiChoiceSelections = {};
  }

  updateResponse(questionId: number | undefined, response: string): void {
    if (questionId === undefined) return;
    this.quizResponses[questionId.toString()] = response;
  }

  onTextAnswerChange(event: Event, questionId: number | undefined): void {
    if (questionId === undefined) return;
    const target = event.target as HTMLInputElement;
    if (target) {
      this.updateResponse(questionId, target.value);
    }
  }

  onMultipleChoiceChange(event: Event, questionId: number | undefined, option: string): void {
    if (questionId === undefined) return;

    const qId = questionId.toString();
    if (!this.multiChoiceSelections[qId]) {
      this.multiChoiceSelections[qId] = new Set<string>();
    }

    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.multiChoiceSelections[qId].add(option);
    } else {
      this.multiChoiceSelections[qId].delete(option);
    }

    // Convert Set to comma-separated string
    if (this.multiChoiceSelections[qId].size > 0) {
      this.quizResponses[qId] = Array.from(this.multiChoiceSelections[qId]).join(',');
    } else {
      delete this.quizResponses[qId];
    }
  }

  submitQuiz(): void {
    if (!this.selectedChapter || !this.selectedQuiz || !this.attemptInProgress) return;

    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;
    if (!userId) {
      this.showNotification('User ID not found');
      return;
    }

    this.courseService.submitQuizResponses(
      this.selectedChapter.id,
      this.selectedQuiz.quizId,
      userId,
      this.quizResponses
    ).subscribe({
      next: (result) => {
        this.quizSubmitted = true;
        this.quizResult = result;
        this.attemptInProgress = false;
        this.showNotification('Quiz submitted successfully');
      },
      error: (err) => {
        console.error('Failed to submit quiz:', err);
        this.showNotification('Failed to submit quiz');
      }
    });
  }

  // PDF Summarization methods
  summarizePdf(): void {
    console.log('Starting PDF summarization');
    if (!this.selectedContent || this.selectedContent.type !== 'pdf') {
      this.showNotification('No PDF content available for summarization');
      return;
    }

    if (!this.pdfBlob) {
      console.error('PDF blob is not available');
      this.showNotification('PDF content is not fully loaded yet. Please try again in a moment.');
      return;
    }

    // Show loading state
    this.generatingSummary = true;
    this.showPdfSummary = true;
    this.pdfSummaryContent = 'Generating summary...';
    this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml('Generating summary...');

    // Use the CourseService which now uses mock data
    this.courseService.summarizePdfContent(this.pdfBlob, this.selectedContent.title)
      .subscribe({
        next: (summary) => {
          console.log('Received PDF summary');
          this.pdfSummaryContent = summary;
          // Format the summary for better display
          const formattedSummary = this.formatSummaryText(summary);
          this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml(formattedSummary);
          this.generatingSummary = false;
          this.showNotification('Summary generated successfully');
        },
        error: (err) => {
          console.error('Error generating PDF summary:', err);
          this.pdfSummaryContent = 'Failed to generate summary. Please try again.';
          this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml('Failed to generate summary. Please try again.');
          this.generatingSummary = false;
          this.showNotification('Failed to generate summary');
        }
      });
  }
  
  // Format the summary text with proper HTML
  private formatSummaryText(text: string): string {
    if (!text) return '';
    
    // Replace line breaks with HTML breaks
    let formatted = text.replace(/\n/g, '<br>');
    
    // Convert bullet points to HTML
    formatted = formatted.replace(/• /g, '&bull; ');
    formatted = formatted.replace(/- /g, '&bull; ');
    
    // Add paragraph formatting
    formatted = formatted.replace(/<br><br>/g, '</p><p>');
    formatted = `<p>${formatted}</p>`;
    
    // Clean up any remaining formatting issues
    formatted = formatted.replace(/<p><br>/g, '<p>');
    formatted = formatted.replace(/<br><\/p>/g, '</p>');
    
    return formatted;
  }

  closeSummary(): void {
    this.resetPdfSummary();
  }

  resetPdfSummary(): void {
    this.showPdfSummary = false;
    this.generatingSummary = false;
    this.pdfSummaryContent = '';
    this.pdfSummaryHtml = '';
  }

  // AI Quiz Generation methods
  toggleAIQuizGenerator(): void {
    this.showAIQuizGenerator = !this.showAIQuizGenerator;
    if (this.showAIQuizGenerator) {
      this.selectedContent = null;
      this.selectedQuiz = null;
      this.revokeBlobUrl();
      this.resetPdfSummary();
      
      // Set a default quiz prompt based on course and chapter info
      if (this.course && this.selectedChapter) {
        this.aiQuizPrompt = `Generate a quiz about ${this.selectedChapter.title} from the course ${this.course.title}`;
      }
    }
  }

  resetAIQuiz(): void {
    this.showAIQuizGenerator = false;
    this.generatedAIQuiz = null;
    this.aiQuizPrompt = '';
    this.aiQuizUserResponses = {};
    this.aiQuizErrorMessage = '';
  }

  generateAIQuiz(): void {
    if (!this.aiQuizPrompt.trim()) {
      this.aiQuizErrorMessage = 'Please enter a topic for the quiz';
      return;
    }

    this.generatingAIQuiz = true;
    this.aiQuizErrorMessage = '';
    this.generatedAIQuiz = null;
    this.aiQuizUserResponses = {};

    const courseTitle = this.course?.title || '';
    const courseDescription = this.course?.description || '';
    const chapterTitle = this.selectedChapter?.title || '';
    const chapterDescription = this.selectedChapter?.description || '';
    
    const prompt = this.createQuizPrompt(this.aiQuizPrompt, courseTitle, courseDescription, chapterTitle, chapterDescription);
    
    this.aiService.generateText(prompt).then(response => {
      console.log('Raw AI response:', response);
      
      try {
        // Extract the JSON from the response
        const jsonResponse = this.extractJsonFromResponse(response);
        
        if (jsonResponse) {
          this.generatedAIQuiz = jsonResponse;
          
          // Fix for generatedAIQuiz.questions null checks (around line 653-656)
          if (this.generatedAIQuiz && this.generatedAIQuiz.questions) {
            this.generatedAIQuiz.questions.forEach((question: any, index: number) => {
              question.questionId = index + 1;
            });
          }
          
          this.showNotification('Quiz generated successfully');
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      } catch (error) {
        console.error('Error generating quiz:', error);
        this.aiQuizErrorMessage = 'Failed to generate quiz. Please try again.';
        this.generatingAIQuiz = false;
        this.showNotification('Failed to generate quiz');
      }
    }).catch(error => {
      console.error('Error calling AI service:', error);
      this.aiQuizErrorMessage = 'Failed to generate quiz. Please try again.';
      this.generatingAIQuiz = false;
      this.showNotification('Failed to generate quiz');
    });
  }

  private createQuizPrompt(topic: string, courseTitle: string, courseDescription: string, chapterTitle: string, chapterDescription: string): string {
    return `Generate a quiz about "${topic}" related to the course "${courseTitle}" (${courseDescription}) and specifically for the chapter "${chapterTitle}" (${chapterDescription}). Create 3 questions.

Your response should be valid JSON that follows this structure:
{
  "title": "A concise title related to ${chapterTitle}",
  "description": "A brief description of the quiz related to ${topic}",
  "timeLimit": 10,
  "passingScore": 2,
  "maxAttempts": 3,
  "questions": [
    // Include exactly 3 questions from the types below
  ]
}

The questions should be formatted like this:
1. For multiple choice single answer:
{
  "questionText": "A clear question about ${topic}",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 1,
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The correct option text"
}

2. For multiple choice multiple answers:
{
  "questionText": "A clear question about ${topic}",
  "questionType": "MULTIPLE_CHOICE_MULTIPLE",
  "points": 2,
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswers": ["Correct option 1", "Correct option 2"]
}

Please create a balanced quiz with interesting questions related to the topic. Return ONLY the JSON with no additional text.`;
  }

  private extractJsonFromResponse(response: string): any {
    try {
      // First try to directly parse the entire response
      return JSON.parse(response);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Error parsing extracted JSON:', innerError);
          return null;
        }
      }
      return null;
    }
  }

  updateAISingleChoiceResponse(questionId: number, answer: string) {
    this.aiQuizUserResponses[questionId] = answer;
  }
  
  updateAIMultipleChoiceResponse(questionId: number, option: string, isChecked: boolean) {
    // Initialize as array if not already
    if (!this.aiQuizUserResponses[questionId] || !Array.isArray(this.aiQuizUserResponses[questionId])) {
      this.aiQuizUserResponses[questionId] = [];
    }
    
    const responses = this.aiQuizUserResponses[questionId] as string[];
    
    if (isChecked) {
      if (!responses.includes(option)) {
        responses.push(option);
      }
    } else {
      const index = responses.indexOf(option);
      if (index !== -1) {
        responses.splice(index, 1);
      }
    }
  }
  
  isAIMultipleChoiceOptionSelected(questionId: number, option: string): boolean {
    return Array.isArray(this.aiQuizUserResponses[questionId]) && 
           (this.aiQuizUserResponses[questionId] as string[]).includes(option);
  }
  
  checkAIQuizAnswers() {
    if (!this.generatedAIQuiz || !this.generatedAIQuiz.questions) return;
    
    let correctCount = 0;
    let totalPoints = 0;
    
    this.generatedAIQuiz.questions.forEach((question: any) => {
      const userAnswer = this.aiQuizUserResponses[question.questionId];
      
      if (question.questionType === 'MULTIPLE_CHOICE_SINGLE') {
        if (userAnswer === question.correctAnswer) {
          correctCount++;
          totalPoints += question.points;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE_MULTIPLE') {
        if (Array.isArray(userAnswer) && question.correctAnswers) {
          // Fix for type casting in array comparison (around line 783-785)
          const correctSet = new Set(question.correctAnswers);
          const userSet = new Set(userAnswer);
          
          if (correctSet.size === userSet.size && 
              [...correctSet].every((value) => userSet.has(value as string))) {
            correctCount++;
            totalPoints += question.points;
          }
        }
      }
    });
    
    const totalQuestions = this.generatedAIQuiz.questions.length;
    const maxPoints = this.generatedAIQuiz.questions.reduce((sum: number, q: any) => sum + q.points, 0);
    
    this.showNotification(`You got ${correctCount} out of ${totalQuestions} questions correct (${totalPoints}/${maxPoints} points).`);
  }

  isYoutubeLink(url: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
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

  showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
