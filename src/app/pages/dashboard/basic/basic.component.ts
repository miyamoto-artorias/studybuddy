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


}
