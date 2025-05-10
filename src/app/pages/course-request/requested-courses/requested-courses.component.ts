import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
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
import { PdfViewerWrapperComponent } from '../../course/enrolled-courses/pdf-viewer-wrapper/pdf-viewer-wrapper.component'; 
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-requested-courses',
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
  templateUrl: './requested-courses.component.html',
  styleUrl: './requested-courses.component.scss'
})
export class RequestedCoursesComponent implements OnInit, OnDestroy{
  @ViewChild('videoPlayer', { static: false }) videoPlayer!: ElementRef<HTMLVideoElement>;

  activeTabId = 'course-1'; // Default to first course
  courses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;
  selectedQuiz: any = null;
  loading = true;
  error: string | null = null;
  // Add new properties for quiz attempts
  quizResponses: { [key: string]: string } = {};
  multiChoiceSelections: { [key: string]: Set<string> } = {};
  attemptInProgress = false;
  quizSubmitted = false;
  quizResult: any = null;
  // Add Object to component
  protected readonly Object = Object;

  constructor(
    private sanitizer: DomSanitizer, 
    private courseService: CourseService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadRequestedCourses();
  }

  loadRequestedCourses(): void {
    this.loading = true;
    this.error = null;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id;
    
    if (!userId) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }
    
    // First, get all requested course IDs
    this.http.get<any[]>(`http://localhost:8081/api/courses/user-requests/${userId}`).subscribe({
      next: (requestedCourses) => {
        console.log('Requested courses IDs received:', requestedCourses);
        
        // If there are no courses, stop here
        if (!requestedCourses || requestedCourses.length === 0) {
          this.courses = [];
          this.loading = false;
          return;
        }
        
        // Store the initial course data
        this.courses = requestedCourses;
        
        // For each course, fetch detailed information including chapters
        const courseDetailsRequests = requestedCourses.map(course => 
          this.courseService.getCourseById(course.id)
        );
        
        // Process all course detail requests
        forkJoin(courseDetailsRequests).subscribe({
          next: (detailedCourses) => {
            console.log('All course details received:', detailedCourses);
            
            // Update courses with detailed information
            for (let i = 0; i < detailedCourses.length; i++) {
              if (detailedCourses[i]) {
                // Preserve the original course ID
                const courseId = this.courses[i].id;
                // Merge the detailed course data
                this.courses[i] = { 
                  ...detailedCourses[i], 
                  id: courseId 
                };
              }
            }
            
            // If there are courses, select the first one
            if (this.courses.length) {
              this.selectCourse(this.courses[0]);
            }
            
            this.loading = false;
          },
          error: (err) => {
            console.error('Error fetching course details:', err);
            // We already have basic course info, so continue with that
            if (this.courses.length) {
              this.selectCourse(this.courses[0]);
            }
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading requested courses:', err);
        this.error = 'Failed to load requested courses';
        this.loading = false;
        this.courses = [];
      }
    });
  }

  loadCourseDetails(courseId: number): void {
    console.log('Loading details for course:', courseId);
    this.courseService.getCourseById(courseId).subscribe({
      next: (courseDetails) => {
        console.log('Course details received:', courseDetails);
        // Update the course in the array with full details
        const index = this.courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          this.courses[index] = { ...this.courses[index], ...courseDetails };
          
          // If this is the selected course, update it too
          if (this.selectedCourse && this.selectedCourse.id === courseId) {
            this.selectedCourse = this.courses[index];
          }
        }
      },
      error: (err) => {
        console.error(`Error loading details for course ${courseId}:`, err);
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
    
    // Get full course details with chapters if not already loaded
    if (!course.chapters || course.chapters.length === 0) {
      console.log('Loading chapters for course:', course.id);
      this.loadCourseChapters(course.id);
    } else {
      console.log('Course already has chapters:', course.chapters);
    }
    
    // Clean up any existing Blob URL
    this.revokeBlobUrl();
  }

  loadCourseChapters(courseId: number): void {
    console.log('Fetching chapters for course:', courseId);
    this.http.get<any[]>(`http://localhost:8081/api/courses/${courseId}/chapters`).subscribe({
      next: (chapters) => {
        console.log('Received chapters:', chapters);
        // Update the selected course with chapters
        this.selectedCourse = {
          ...this.selectedCourse,
          chapters: chapters
        };
        
        // Also update the course in the array
        const index = this.courses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          this.courses[index] = {
            ...this.courses[index],
            chapters: chapters
          };
        }
        
        // If there are chapters, select the first one
        if (chapters && chapters.length > 0) {
          this.selectChapter(chapters[0]);
        }
      },
      error: (err) => {
        console.error('Error loading chapters:', err);
        this.selectedCourse = {
          ...this.selectedCourse,
          chapters: []
        };
      }
    });
  }

  selectChapter(chapter: any): void {
    console.log('Chapter selected:', chapter);
    this.selectedChapter = chapter;
    this.selectedQuiz = null;
    
    // Initialize quizzes array if it doesn't exist
    if (!this.selectedChapter.quizzes) {
      this.selectedChapter.quizzes = [];
    }
    
    // Check if chapter contents exist, if not load them
    if (!chapter.contents || chapter.contents.length === 0) {
      console.log('Chapter has no contents, loading from API:', chapter.id);
      this.loadChapterContents(chapter.id);
    } else {
      console.log('Chapter already has contents:', chapter.contents);
      if (chapter.contents.length > 0) {
        this.selectContent(chapter.contents[0]);
      } else {
        this.selectedContent = null;
        this.revokeBlobUrl();
      }
    }
    
    // Load quizzes for the selected chapter
    console.log('Loading quizzes for chapter:', chapter.id);
    this.loadChapterQuizzes(chapter.id);
  }

  loadChapterContents(chapterId: number): void {
    console.log('Loading contents for chapter:', chapterId);
    this.http.get<any[]>(`http://localhost:8081/api/chapters/${chapterId}/contents`).subscribe({
      next: (contents) => {
        console.log('Received contents:', contents);
        
        // Update the selected chapter with contents
        if (this.selectedChapter && this.selectedChapter.id === chapterId) {
          this.selectedChapter.contents = contents;
          // Force change detection by creating a new reference
          this.selectedChapter = { ...this.selectedChapter };
          
          // Select the first content if available
          if (contents && contents.length > 0) {
            this.selectContent(contents[0]);
          }
        }
        
        // Also update in the chapters array if possible
        if (this.selectedCourse && this.selectedCourse.chapters) {
          const chapterIndex = this.selectedCourse.chapters.findIndex((c: any) => c.id === chapterId);
          if (chapterIndex !== -1) {
            this.selectedCourse.chapters[chapterIndex].contents = contents;
          }
        }
      },
      error: (err) => {
        console.error('Error loading chapter contents:', err);
        if (this.selectedChapter) {
          this.selectedChapter.contents = [];
          // Force change detection by creating a new reference
          this.selectedChapter = { ...this.selectedChapter };
        }
      }
    });
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
    console.log('Selected Course:', this.selectedCourse?.id);
    console.log('Selected Chapter:', this.selectedChapter?.id);
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
    } else if (content.type === 'video') {
      console.log('Processing video content');
      const courseId = this.selectedCourse?.id;
      const chapterId = this.selectedChapter?.id;
      const contentId = content?.id;

      if (!courseId || !chapterId || !contentId) {
        console.error('Missing required IDs:', { courseId, chapterId, contentId });
        this.selectedContent = { ...this.selectedContent, error: true };
        return;
      }

      this.streamVideo(courseId, chapterId, contentId);
    } else {
      console.log('Content type not handled:', content.type);
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

  // Quiz functionality methods
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

}
