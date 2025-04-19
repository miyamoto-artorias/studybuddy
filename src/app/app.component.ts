import { afterNextRender, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ScreenLoaderComponent } from '@app/screen-loader/screen-loader.component';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import {
  AnalyticsService, EnvironmentService, InactivityTrackerService,
  PageLoadingBarComponent,
  ScreenLoaderService, SeoService,
  ThemeManagerService
} from '@elementar-ui/components';
import { AddcourseComponent } from './MyBucket/addcourse/addcourse.component';
import { LoginComponent } from './MyBucket/login/login.component';
import { BasicComponent } from './pages/dashboard/basic/basic.component';
import { TeacherCoursesComponent } from './MyBucket/teacher-courses/teacher-courses.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, LoginComponent,BasicComponent,
    ScreenLoaderComponent,TeacherCoursesComponent,
    PageLoadingBarComponent,
    AddcourseComponent
],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private _themeManager = inject(ThemeManagerService);
  private _screenLoader = inject(ScreenLoaderService);
  private _analyticsService = inject(AnalyticsService);
  private _inactivityTracker = inject(InactivityTrackerService);
  private _seoService = inject(SeoService);
  private _envService = inject(EnvironmentService);
  private _platformId = inject(PLATFORM_ID);
  private _router = inject(Router);

  loadingText = signal('Application Loading');
  pageLoaded = signal(false);

  constructor() {
    afterNextRender(() => {
      // Scroll a page to top if url changed
      this._router.events
        .pipe(
          filter(event=> event instanceof NavigationEnd)
        )
        .subscribe(() => {
          window.scrollTo({
            top: 0,
            left: 0
          });
          setTimeout(() => {
            this._screenLoader.hide();
            this.pageLoaded.set(true);
          }, 1500);
        })
      ;

      this._analyticsService.trackPageViews();
      this._inactivityTracker.setupInactivityTimer()
        .subscribe(() => {
          // console.log('Inactive mode has been activated!');
          // this._inactivityTracker.reset();
        })
      ;
    });
  }

  ngOnInit(): void {
    this._themeManager.setColorScheme(this._themeManager.getPreferredColorScheme());

    if (isPlatformBrowser(this._platformId)) {
      setTimeout(() => {
        this.loadingText.set('STUDDYBUDDY');
      }, 1000);
    }

    this._seoService.trackCanonicalChanges(this._envService.getValue('siteUrl'));
  }
}
