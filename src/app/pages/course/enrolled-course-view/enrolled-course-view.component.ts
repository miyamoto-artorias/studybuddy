import { Component, OnInit, OnDestroy, ViewChild, ElementRef, PLATFORM_ID, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
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
import { PdfViewerWrapperComponent } from '../enrolled-courses/pdf-viewer-wrapper/pdf-viewer-wrapper.component';

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

  courseId!: number;
  course: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;
  selectedQuiz: any = null;
  loading = true;
  error: string | null = null;
  isBrowser: boolean;

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

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer, 
    private courseService: CourseService,
    private authService: AuthService,
    private http: HttpClient,
    private aiService: AiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.courseId = +id;
        this.loadCourse();
      } else {
        this.error = 'Course ID not provided';
        this.loading = false;
      }
    });
  }

  loadCourse(): void {
    this.loading = true;
    this.error = null;
    
    this.authService.getEnrolledCourses().subscribe({
      next: (courses) => {
        this.course = courses.find(c => c.id === this.courseId);
        if (this.course) {
          console.log('Course loaded:', this.course);
          if (this.course.chapters && this.course.chapters.length > 0) {
            this.selectChapter(this.course.chapters[0]);
          }
        } else {
          this.error = 'Course not found';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.error = 'Failed to load course';
        this.loading = false;
      }
    });
  }

  selectChapter(chapter: any): void {
    console.log('Chapter selected:', chapter);
    this.selectedChapter = chapter;
    this.selectedQuiz = null;
    this.resetAIQuiz();
    this.resetPdfSummary();
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
    console.log('Selected Course:', this.course);
    console.log('Selected Chapter:', this.selectedChapter);
    this.revokeBlobUrl();
    this.selectedContent = { ...content };
    this.resetAIQuiz();
    this.resetPdfSummary();

    // Only process PDF and video content in browser environment
    if (!this.isBrowser) {
      return;
    }

    if (content.type === 'pdf') {
      console.log('Processing PDF content');
      const courseId = this.course?.id;
      const chapterId = this.selectedChapter?.id;
      const contentId = content?.id;
      
      console.log('Course ID from course:', courseId);
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
              this.pdfBlob = blob; // Store the PDF blob for summarization
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
    } else if (content.type === 'video') {
      console.log('Processing video content');
      const courseId = this.course?.id;
      const chapterId = this.selectedChapter?.id;
      const contentId = content?.id;

      if (!courseId || !chapterId || !contentId) {
        console.error('Missing required IDs:', { courseId, chapterId, contentId });
        this.selectedContent = { ...this.selectedContent, error: true };
        return;
      }

      this.streamVideo(courseId, chapterId, contentId);
    }
  }

  streamVideo(courseId: number, chapterId: number, contentId: number): void {
    const url = `http://localhost:8081/api/course-content/course/${courseId}/chapter/${chapterId}/stream-video/${contentId}`;
    const headers = new HttpHeaders({
      'Range': 'bytes=0-'
    });

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
      const videoUrl: string = URL.createObjectURL(blob);
      this.videoPlayer.nativeElement.src = videoUrl;
      this.videoPlayer.nativeElement.load();
      this.videoPlayer.nativeElement.play();
      },
      error: (error: any) => {
      console.error('Video stream failed:', error);
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

  // PDF Summarization methods
  summarizePdf(): void {
    if (!this.pdfBlob || !this.selectedContent || this.selectedContent.type !== 'pdf') {
      console.error('No PDF content available for summarization');
      return;
    }

    this.generatingSummary = true;
    this.showPdfSummary = true;
    this.pdfSummaryContent = 'Generating summary...';
    this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml('Generating summary...');

    this.courseService.summarizePdfContent(this.pdfBlob, this.selectedContent.title)
      .subscribe({
        next: (summary) => {
          console.log('Received PDF summary');
          this.pdfSummaryContent = summary;
          // Format the summary for better display with proper line breaks and paragraphs
          const formattedSummary = this.formatSummaryText(summary);
          this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml(formattedSummary);
          this.generatingSummary = false;
        },
        error: (err) => {
          console.error('Error generating PDF summary:', err);
          this.pdfSummaryContent = 'Failed to generate summary. Please try again.';
          this.pdfSummaryHtml = this.sanitizer.bypassSecurityTrustHtml('Failed to generate summary. Please try again.');
          this.generatingSummary = false;
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

  // Add new methods for quiz functionality
  startQuizAttempt(): void {
    if (!this.selectedChapter || !this.selectedQuiz) return;
    this.attemptInProgress = true;
    this.quizResponses = {};
    this.multiChoiceSelections = {};
  }

  updateResponse(questionId: number | undefined, response: string): void {
    if (questionId === undefined) {
      console.error('Question ID is undefined');
      return;
    }
    this.quizResponses[questionId.toString()] = response;
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

    console.log('Updated responses:', this.quizResponses);
  }

  submitQuiz(): void {
    if (!this.selectedChapter || !this.selectedQuiz || !this.attemptInProgress) return;

    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;
    if (!userId) {
      console.error('No user ID found');
      return;
    }

    console.log('Submitting responses:', this.quizResponses);
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

  getVideoUrl(contentPath: string): string {
    // Ensure the video is served from the assets folder or a server
    return contentPath.startsWith('http') ? contentPath : `assets/videos/${contentPath}`;
  }

  playVideo(contentPath: string): void {
    const videoUrl = this.getVideoUrl(contentPath);
    if (this.videoPlayer && this.videoPlayer.nativeElement) {
      this.videoPlayer.nativeElement.src = videoUrl;
      this.videoPlayer.nativeElement.load();
      this.videoPlayer.nativeElement.play();
    } else {
      console.error('Video player is not initialized');
    }
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

  async generateAIQuiz(): Promise<void> {
    if (!this.aiQuizPrompt.trim()) {
      this.aiQuizErrorMessage = 'Please enter a topic for the quiz';
      return;
    }

    this.generatingAIQuiz = true;
    this.aiQuizErrorMessage = '';
    this.generatedAIQuiz = null;
    this.aiQuizUserResponses = {};

    try {
      const courseTitle = this.course?.title || '';
      const courseDescription = this.course?.description || '';
      const chapterTitle = this.selectedChapter?.title || '';
      const chapterDescription = this.selectedChapter?.description || '';
      
      const prompt = this.createQuizPrompt(this.aiQuizPrompt, courseTitle, courseDescription, chapterTitle, chapterDescription);
      const response = await this.aiService.generateText(prompt);
      
      console.log('Raw AI response:', response);
      
      // Extract the JSON from the response
      const jsonResponse = this.extractJsonFromResponse(response);
      
      if (jsonResponse) {
        this.generatedAIQuiz = jsonResponse as Quiz;
        
        // Assign questionId to each question (for tracking responses)
        this.generatedAIQuiz.questions.forEach((question, index) => {
          question.questionId = index + 1;
        });
        
        console.log('Parsed quiz:', this.generatedAIQuiz);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      this.aiQuizErrorMessage = 'Failed to generate quiz. Please try again.';
    } finally {
      this.generatingAIQuiz = false;
    }
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

  private extractJsonFromResponse(response: string): Quiz | null {
    try {
      // First try to directly parse the entire response
      return JSON.parse(response) as Quiz;
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Quiz;
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
    console.log('Updated AI quiz responses:', this.aiQuizUserResponses);
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
    
    console.log('Updated AI quiz responses:', this.aiQuizUserResponses);
  }
  
  isAIMultipleChoiceOptionSelected(questionId: number, option: string): boolean {
    return Array.isArray(this.aiQuizUserResponses[questionId]) && 
           (this.aiQuizUserResponses[questionId] as string[]).includes(option);
  }
  
  checkAIQuizAnswers() {
    if (!this.generatedAIQuiz) return;
    
    let correctCount = 0;
    let totalPoints = 0;
    
    this.generatedAIQuiz.questions.forEach(question => {
      const userAnswer = this.aiQuizUserResponses[question.questionId!];
      
      if (question.questionType === 'MULTIPLE_CHOICE_SINGLE') {
        if (userAnswer === question.correctAnswer) {
          correctCount++;
          totalPoints += question.points;
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE_MULTIPLE') {
        if (Array.isArray(userAnswer) && question.correctAnswers) {
          // Check if arrays have the same elements (order doesn't matter)
          const correctSet = new Set(question.correctAnswers);
          const userSet = new Set(userAnswer);
          
          if (correctSet.size === userSet.size && 
              [...correctSet].every(value => userSet.has(value))) {
            correctCount++;
            totalPoints += question.points;
          }
        }
      }
    });
    
    const totalQuestions = this.generatedAIQuiz.questions.length;
    const maxPoints = this.generatedAIQuiz.questions.reduce((sum, q) => sum + q.points, 0);
    
    alert(`You got ${correctCount} out of ${totalQuestions} questions correct (${totalPoints}/${maxPoints} points).`);
  }
}
