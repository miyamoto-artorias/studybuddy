import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  IconComponent
} from '@elementar-ui/components';
import { MatTooltip } from '@angular/material/tooltip';
import {
  TabPanelAsideContentDirective,
  TabPanelAsideComponent,
  TabPanelComponent,
  TabPanelHeaderComponent,
  TabPanelItemComponent,
  TabPanelItemIconDirective,
  TabPanelNavComponent
} from '@elementar-ui/components';
import { CommonModule } from '@angular/common';
import { PdfViewerWrapperComponent } from '../../../pdf-viewer-wrapper/pdf-viewer-wrapper.component';

@Component({
  selector: 'app-basic',
  // Do not import PdfViewerModule here; we use our wrapper component instead.
  imports: [
    IconComponent,
    MatTooltip,CommonModule,PdfViewerWrapperComponent,
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
export class BasicComponent implements OnInit {
  activeTabId = 'courses';
  courses: any[] = [];
  selectedCourse: any = null;
  selectedChapter: any = null;
  selectedContent: any = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Load enrolled courses from localStorage
    const stored = localStorage.getItem('enrolledCourses');
    if (stored) {
      this.courses = JSON.parse(stored);
    } else {
      console.warn('No enrolledCourses in localStorage, using dummy data for testing.');
      // Dummy data for testing
      this.courses = [
        {
          id: 1,
          title: 'Advanced Java',
          description: 'A comprehensive course covering advanced Java concepts.',
          picture: 'https://example.com/course-images/java-advanced.jpg',
          price: 99.99,
          chapters: [
            {
              id: 1,
              title: 'Introduction',
              description: 'Introduction to Advanced Java',
              contents: [
                {
                  id: 101,
                  title: 'Introduction Video',
                  content: 'https://www.youtube.com/watch?v=WwrHeB93DVM',
                  type: 'video'
                }
              ]
            },
            {
              id: 2,
              title: 'Advanced Topics',
              description: 'Deep dive into advanced Java topics',
              contents: [
                {
                  id: 102,
                  title: 'Advanced PDF',
                  content: 'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf',
                  type: 'pdf'
                }
              ]
            }
          ]
        }
      ];
    }
    console.log('Courses loaded:', this.courses);
    if (this.courses.length) {
      this.selectCourse(this.courses[0]);
    }
  }


  

  ////////////////////////////
  selectCourse(course: any): void {
    console.log('Course selected:', course);
    this.selectedCourse = course;
    // Clear previous selections.
    this.selectedChapter = null;
    this.selectedContent = null;
  }

  selectChapter(chapter: any): void {
    console.log('Chapter selected:', chapter);
    this.selectedChapter = chapter;
    // Automatically select the first content item if available.
    if (chapter.contents && chapter.contents.length) {
      this.selectContent(chapter.contents[0]);
    } else {
      this.selectedContent = null;
    }
  }

  selectContent(content: any): void {
    console.log('Content selected:', content);
    this.selectedContent = content;
  }

  isYoutubeLink(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1].split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
