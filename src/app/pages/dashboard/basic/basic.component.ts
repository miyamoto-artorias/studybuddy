import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { IconComponent } from '@elementar-ui/components';
import {
  TabPanelAsideComponent,
  TabPanelAsideContentDirective,
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
    // Do NOT import PdfViewerModule here
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
    const stored = localStorage.getItem('enrolledCourses');
    if (stored) {
      this.courses = JSON.parse(stored);
      if (this.courses.length) {
        this.selectCourse(this.courses[0]);
      }
    }
  }

  selectCourse(course: any): void {
    this.selectedCourse = course;
    this.selectedChapter = null;
    this.selectedContent = null;
  }

  selectChapter(chapter: any): void {
    this.selectedChapter = chapter;
    if (chapter.contents && chapter.contents.length) {
      this.selectedContent = chapter.contents[0];
    } else {
      this.selectedContent = null;
    }
  }

  selectContent(content: any): void {
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
