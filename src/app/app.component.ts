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

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ScreenLoaderComponent,
    PageLoadingBarComponent
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

  loadingText = signal('loading StudyBuddy...');
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
    // Set initial color scheme to light mode
    this._themeManager.changeColorScheme('light');
    
    // If user has a stored preference, use that instead
    const storedPreference = this._themeManager.getPreferredColorScheme();
    if (storedPreference) {
      this._themeManager.setColorScheme(storedPreference);
    }

    this._seoService.trackCanonicalChanges(this._envService.getValue('siteUrl'));
  }
}
