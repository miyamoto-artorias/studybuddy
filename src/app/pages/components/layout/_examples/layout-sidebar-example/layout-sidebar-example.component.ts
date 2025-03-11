import { Component } from '@angular/core';
import { LayoutBodyComponent } from '@elementar-ui/components';
import { LayoutComponent } from '@elementar-ui/components';
import { LayoutSidebarComponent } from '@elementar-ui/components';

@Component({
  selector: 'app-layout-sidebar-example',
  imports: [
    LayoutBodyComponent,
    LayoutComponent,
    LayoutSidebarComponent
  ],
  templateUrl: './layout-sidebar-example.component.html',
  styleUrl: './layout-sidebar-example.component.scss'
})
export class LayoutSidebarExampleComponent {

}
