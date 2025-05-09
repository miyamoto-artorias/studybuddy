import { Component, inject, OnInit, viewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Location } from '@angular/common';
import { LogoComponent, NavigationItem } from '@elementar-ui/components';
import { v7 as uuid } from 'uuid';
import {
  SidebarBodyComponent,
  SidebarCompactViewModeDirective,
  SidebarComponent as EmrSidebarComponent,
  SidebarFooterComponent,
  SidebarFullViewModeDirective,
  SidebarHeaderComponent,
  SidebarNavComponent
} from '@elementar-ui/components';
import { DicebearComponent } from '@elementar-ui/components';
import { MatIconButton } from '@angular/material/button';
import { ToolbarComponent } from '@store/sidebar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    MatIcon,
    RouterLink,
    ToolbarComponent,
    SidebarBodyComponent,
    SidebarCompactViewModeDirective,
    SidebarFullViewModeDirective,
    EmrSidebarComponent,
    SidebarFooterComponent,
    SidebarHeaderComponent,
    SidebarNavComponent,
    DicebearComponent,
    MatIconButton,
    LogoComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    'class': 'sidebar',
    '[class.compact]': 'compact'
  }
})
export class SidebarComponent implements OnInit {
  router = inject(Router);
  location = inject(Location);
  authService = inject(AuthService);
  height: string | null = '200px';
  compact = false;

  readonly navigation = viewChild.required<any>('navigation');

  navItems: NavigationItem[] = [
    {
      key: 'Course Request',
      type: 'group',
      icon: 'view_quilt',
      name: 'Course Request',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Make course Request',
          link: '/pages/course-request/make-courses-request'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Requested Course',
          link: '/pages/course-request/requested-courses'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'View Course Requests',
          link: '/pages/course-request/view-course-requests'
        }
      ]
    },
    
    {
      key: 'dashboard',
      type: 'group',
      name: 'Dashboard',
      icon: 'dashboard',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Basic',
          link: '/pages/dashboard/basic'
        },          
       {
        key: uuid(),
        type: 'link',
        name: 'playground',
        link: '/pages/dashboard/playground'
       }
      ]
    },
     {
      key: 'Settings',  
      type: 'group',
      name: 'Settings',
      icon: 'settings',
      children: [
        {key: uuid(),
        type: 'link',
        name: 'Profile',
        link: '/pages/settings/profile'
        },
        {key: uuid(),
        type: 'link',
        name: 'Credit Card',   
        link: '/pages/settings/credit-card'},
        {key: uuid(),
        type: 'link',
        name: 'Payment History',   
        link: '/pages/settings/payment-history'}
      ]
     }
    ,{
      key: 'Courses',
      type: 'group',
      icon: 'apps',
      name: 'Courses',
      children: [

        {
          key: uuid(),
          type: 'link',
          name: 'Enrolled_Courses',
          link: '/pages/course/enrolled-courses'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'addcourse',
          link: '/pages/course/addcourse'
        },            {
          key: uuid(),
          type: 'link',
          name: 'teachercourses',
          link: '/pages/course/teachercourses'
        },        {
          key: uuid(),
          type: 'link',
          name: 'courses',
          link: '/pages/course/courses'
        },        {
          key: uuid(),
          type: 'link',
          name: 'teacher',
          link: `/pages/course/teacher/${this.authService.getUserId()}`
        }
      ]
    },

    {
      key: 'applications',
      type: 'group',
      icon: 'apps',
      name: 'Applications',
      children: [
      
        {
          key: uuid(),
          type: 'link',
          name: 'File Manager',
          link: '/pages/applications/file-manager'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Kanban Board',
          link: '/pages/applications/kanban-board'
        }
      ]
    },
    
    
    
    {
      key: 'content',
      type: 'group',
      icon: 'edit_note',
      name: 'Content',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Post List',
          link: '/pages/content/posts/list'
        }
      ]
    },
    {
      key: 'error-pages',
      type: 'group',
      icon: 'error',
      name: 'Error Pages',
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Not Found (404)',
          link: '/error/not-found'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Server Error (500)',
          link: '/error/internal-server-error'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Forbidden (401)',
          link: '/error/forbidden'
        }
      ]
    },
    
  ];
  navItemLinks: NavigationItem[] = [];
  activeKey: null | string = null;

  ngOnInit() {
    this.navItems.forEach(navItem => {
      this.navItemLinks.push(navItem);

      if (navItem.children) {
        this.navItemLinks = this.navItemLinks.concat(navItem.children as NavigationItem[]);
      }
    });
    this._activateLink();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this._activateLink();
      })
    ;
  }

  private _activateLink() {
    const activeLink = this.navItemLinks.find(
      navItem => {
        if (navItem.link === this.location.path()) {
          return true;
        }

        if (navItem.type === 'group') {
          return (this.location.path() !== '/' && this.location.path().includes(navItem.link as string));
        }

        return false;
      }
    );

    if (activeLink) {
      this.activeKey = activeLink.key;
    } else {
      this.activeKey = null;
    }
  }
}
