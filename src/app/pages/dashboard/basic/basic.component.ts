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
  selector: 'app-basic',
  standalone: true,
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
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss']
})
export class BasicComponent implements OnInit, OnDestroy {
  activeTabId = 'course-1'; // Default to first course
  courses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;
  loading = true;
  error: string | null = null;

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
    // Clean up any existing Blob URL
    this.revokeBlobUrl();
  }

  selectChapter(chapter: any): void {
    console.log('Chapter selected:', chapter);
    this.selectedChapter = chapter;
    if (chapter.contents && chapter.contents.length) {
      this.selectContent(chapter.contents[0]);
    } else {
      this.selectedContent = null;
      this.revokeBlobUrl();
    }
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
}