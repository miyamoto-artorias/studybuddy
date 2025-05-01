import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../../services/profile.service';  // Adjust path if needed
import { AuthService } from '../../../services/auth.service';  // Add this import
import { CommonModule } from '@angular/common';

interface UserDetails {
  id: number;
  userType: string;
  username: string;
  email: string;
  fullName: string;
  profilePicture: string;  // Adjust based on API
  bio: string;
  location: string;
  preferredLanguage: string[];
  socialLinks: { [key: string]: string };  // Object with string keys and values
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule],  // Add any necessary imports here if needed, e.g., CommonModule
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userDetails: UserDetails | null = null;  // Updated type
  profilePictureUrl: string = '';
  userId: number = 2;  // Will be overwritten

  constructor(private profileService: ProfileService, private authService: AuthService) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
    } else {
      console.error('No current user found; redirect or handle accordingly');
      // Optionally, redirect to login: this.router.navigate(['/login']);
    }

    this.profileService.getUserDetails(this.userId).subscribe({
      next: (data) => {
        this.userDetails = data;
      },
      error: (err) => console.error('Error fetching user details:', err)
    });

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
}
