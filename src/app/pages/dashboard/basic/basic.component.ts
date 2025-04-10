import { Component } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { IconComponent } from '@elementar-ui/components';
import {
  TabPanelAsideComponent,
  TabPanelAsideContentDirective, TabPanelComponent,
   TabPanelHeaderComponent,
  TabPanelItemComponent,
  TabPanelItemIconDirective, TabPanelNavComponent
} from '@elementar-ui/components';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  imports: [IconComponent,
    MatTooltip,
    TabPanelItemIconDirective,
    TabPanelItemComponent,
    TabPanelAsideContentDirective,
    TabPanelAsideComponent,
    TabPanelNavComponent,
    TabPanelHeaderComponent,
    TabPanelComponent,PdfViewerModule,

  ],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.scss'
})
export class BasicComponent {
  pdfSrc = "https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf";
  activeTabId = 'dashboard';
  
  tabs = [
    {
      id: 'dashboard',
      tooltip: 'Dashboard',
      icon: 'ph:house-duotone',
      pdfSrc: 'path/to/your/pdf.pdf'
    },
    {
      id: 'nested',
      tooltip: 'Nested',
      icon: 'ph:kanban-duotone',
      nested: true,
      nestedActiveId: 'nest1',
      nestedTabs: [
        {
          id: 'nest1',
          tooltip: 'PDF',
          icon: 'ph:file-pdf',
          pdfSrc: 'https://vadimdez.github.io/ng2-pdf-viewer/assets/pdf-test.pdf'
        },
        {
          id: 'nest2',
          tooltip: 'YouTube Video',
          icon: 'ph:video-camera',
          videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Example YouTube embed URL
        }
      ]
    },
    {
      id: 'videos',
      tooltip: 'Video Library',
      icon: 'ph:play-circle',
      videoSrc: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Example YouTube embed URL
    }
  ];

  constructor(private sanitizer: DomSanitizer) {}

  isYoutubeLink(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getSafeYoutubeUrl(url: string): SafeResourceUrl {
    // Convert YouTube watch URL to embed URL if needed
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1].split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

}
