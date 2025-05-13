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
  isTeacher: boolean = false;

  readonly navigation = viewChild.required<any>('navigation');

  // Course request items - will filter based on user type
  courseRequestItems: NavigationItem[] = [
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
  ];

  // Teacher-only course request items
  teacherOnlyCourseRequestItems: NavigationItem[] = [
    {
      key: uuid(),
      type: 'link',
      name: 'Requested Courses Teacher',
      link: '/pages/course-request/requested-courses-teacher'
    },
    
  ];

  // Course items - will filter based on user type
  courseItems: NavigationItem[] = [
    {
      key: uuid(),
      type: 'link',
      name: 'My Enrolled Courses',
      link: '/pages/course/enrolled-courses-list'
    }
  ];



  // Common courses item that's visible to all
  commonCourseItems: NavigationItem[] = [
    {
      key: uuid(),
      type: 'link',
      name: 'courses',
      link: '/pages/course/courses'
    }
  ];
  navItems: NavigationItem[] = [
    {      key: 'Teacher_pages',
      type: 'group',
      name: 'Teacher pages',
      icon: 'school', // Changed the icon to 'school' to better represent teacher-related content
      children: [
        {
          key: uuid(),
          type: 'link',
          name: 'Teacher Courses',
          link: '/pages/teacher/teacher-courses-list'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Add Course',
          link: '/pages/teacher/addcourse'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Manage Courses',
          link: '/pages/teacher/teachercourses'
        },
        {
          key: uuid(),
          type: 'link',
          name: 'Teacher Requested courses',
          link: '/pages/course-request/requested-courses-teacher'
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
          name: 'Welcom page',
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
      key: 'Courses',
      type: 'group',
      icon: 'apps',
      name: 'Courses',
      children: []  // Will be populated in ngOnInit based on user type
     },

    {
      key: 'Course Request',
      type: 'group',
      icon: 'view_quilt',
      name: 'Course Request',
      children: []  // Will be populated in ngOnInit based on user type
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
    // Check if user is a teacher
    this.isTeacher = this.authService.isUserTeacher();
    
    // Show/hide the Teacher pages section based on user role
    const teacherPagesIndex = this.navItems.findIndex(item => item.key === 'Teacher_pages');
    if (teacherPagesIndex !== -1 && !this.isTeacher) {
      // Remove the Teacher pages section if user is not a teacher
      this.navItems.splice(teacherPagesIndex, 1);
    }
    
    // Populate Course Request items based on user type
    const courseRequestGroup = this.navItems.find(item => item.key === 'Course Request');
    if (courseRequestGroup) {
      courseRequestGroup.children = [...this.courseRequestItems];
      
      // Add teacher-only items if user is a teacher
      if (this.isTeacher) {
        courseRequestGroup.children = [...courseRequestGroup.children, ...this.teacherOnlyCourseRequestItems];
      }
    }
    
    // Populate Courses items based on user type
    const coursesGroup = this.navItems.find(item => item.key === 'Courses');
    if (coursesGroup) {
      coursesGroup.children = [...this.courseItems, ...this.commonCourseItems];
      
      // Add teacher-only items if user is a teacher
      if (this.isTeacher) {
        coursesGroup.children = [...this.courseItems, ...this.commonCourseItems];
      }
    }

    // Process all navigation items for the sidebar
    this.navItemLinks = [];
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
