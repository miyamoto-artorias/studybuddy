import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface UserDetails {
  id: number;
  userType: string;
  username: string;
  email: string;
  fullName: string;
  profilePicture: string;
  bio: string;
  location: string;
  preferredLanguage: string[];
  socialLinks: { [key: string]: string };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userDetails: UserDetails | null = null;
  profilePictureUrl: string = '';
  userId: number = 0;
  isUploading: boolean = false;

  constructor(
    private profileService: ProfileService, 
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
    } else {
      console.error('No current user found; redirect or handle accordingly');
      // Optionally, redirect to login: this.router.navigate(['/login']);
    }

    this.loadUserDetails();
  }

  loadUserDetails() {
    this.profileService.getUserDetails(this.userId).subscribe({
      next: (data) => {
        this.userDetails = data;
      },
      error: (err) => console.error('Error fetching user details:', err)
    });

    this.loadProfilePicture();
  }

  loadProfilePicture() {
    this.profileService.getProfilePicture(this.userId).subscribe({
      next: (data: Blob) => {
        console.log('Profile picture API response:', data);
        this.profilePictureUrl = URL.createObjectURL(data);
      },
      error: (err) => {
        console.error('Error fetching profile picture:', err);
      }
    });
  }

  triggerFileInput() {
    document.getElementById('profilePictureInput')?.click();
  }

  handleFileInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];
    
    if (file) {
      this.uploadProfilePicture(file);
    }
  }

  uploadProfilePicture(file: File) {
    this.isUploading = true;
    
    this.authService.uploadProfilePicture(file).subscribe({
      next: (response) => {
        console.log('Profile picture uploaded successfully:', response);
        this.snackBar.open('Profile picture updated successfully', 'Close', { duration: 3000 });
        this.loadProfilePicture();
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Error uploading profile picture:', error);
        this.snackBar.open('Failed to upload profile picture', 'Close', { duration: 5000 });
        this.isUploading = false;
      }
    });
  }
}
