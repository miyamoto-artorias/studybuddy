import { Component, computed, inject, Input, ViewChild, ElementRef, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatBadge } from '@angular/material/badge';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { SoundEffectDirective, ThemeManagerService } from '@elementar-ui/components';
import { LayoutApiService } from '@elementar-ui/components';
import { DicebearComponent } from '@elementar-ui/components';
import { AssistantSearchComponent, NotificationsPopoverComponent } from '@store/header';
import { PopoverTriggerForDirective } from '@elementar-ui/components';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, map, of } from 'rxjs';
import { NgIf, CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [
    MatIcon,
    MatIconButton,
    MatBadge,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    DicebearComponent,
    MatDivider,
    MatButton,
    MatTooltip,
    RouterLink,
    AssistantSearchComponent,
    MatAnchor,
    SoundEffectDirective,
    NotificationsPopoverComponent,
    PopoverTriggerForDirective,
    NgIf,
    CommonModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  host: {
    'class': 'block w-full'
  }
})
export class HeaderComponent implements OnInit {
  protected _themeManager = inject(ThemeManagerService);
  private _layoutApi = inject(LayoutApiService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private sanitizer = inject(DomSanitizer);
  
  profilePictureUrl: SafeUrl | null = null;

  sidebarShown= computed(() => {
    return this._layoutApi.isSidebarShown('root')
  });

  ngOnInit() {
    this.loadProfilePicture();
  }

  toggleSidebar(): void {
    if (this.sidebarShown()) {
      this._layoutApi.hideSidebar('root');
    } else {
      this._layoutApi.showSidebar('root');
    }
  }

  /**
   * Load user's profile picture
   */
  loadProfilePicture(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.profileService.getProfilePicture(userId).subscribe({
        next: (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.profilePictureUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error('Error loading profile picture:', err);
          this.profilePictureUrl = null;
        }
      });
    }
  }

  /**
   * Get profile image source (profilePicture URL or null for fallback)
   */
  getProfileImageSrc(): SafeUrl | null {
    return this.profilePictureUrl;
  }

  /**
   * Log out the current user
   * Clears all storage and redirects to login page
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Get the current user's information
   */
  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }
}
