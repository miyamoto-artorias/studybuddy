import { Component } from '@angular/core';
import { DashboardComponent, Widget, WidgetConfig } from '@elementar-ui/components';
import { MatTooltip } from '@angular/material/tooltip';
import { IconComponent } from '@elementar-ui/components';
import { HorizontalDividerComponent } from '@elementar-ui/components';
import { AvatarComponent } from '@elementar-ui/components';
import {
  TabPanelAsideComponent,
  TabPanelAsideContentDirective, TabPanelBodyComponent, TabPanelComponent,
  TabPanelCustomItemComponent, TabPanelFooterComponent, TabPanelHeaderComponent,
  TabPanelItemComponent,
  TabPanelItemIconDirective, TabPanelNavComponent
} from '@elementar-ui/components';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PlaygroundComponent } from '@meta/playground/playground.component';
import { NavigationWithNestedMenuExampleComponent } from '../../../MyBucket/navigation-with-nested-menu-example/navigation-with-nested-menu-example.component';
import {
  NavigationComponent,
  NavigationGroupComponent, NavigationGroupMenuComponent, NavigationGroupToggleComponent,
  NavigationGroupToggleIconDirective,
  NavigationItemComponent
} from '@elementar-ui/components';
import { MatIcon } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  imports: [IconComponent,
    MatTooltip,
    HorizontalDividerComponent,
    AvatarComponent,
    TabPanelItemIconDirective,
    TabPanelItemComponent,
    TabPanelCustomItemComponent,
    TabPanelAsideContentDirective,
    TabPanelAsideComponent,
    TabPanelNavComponent,
    TabPanelFooterComponent,
    TabPanelBodyComponent,
    TabPanelHeaderComponent,
    TabPanelComponent,PdfViewerModule,NavigationWithNestedMenuExampleComponent,PlaygroundComponent,
    MatIcon,
    NavigationItemComponent,
    NavigationGroupComponent,
    NavigationGroupToggleIconDirective,
    NavigationComponent,
    NavigationGroupToggleComponent,
    NavigationGroupMenuComponent

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
