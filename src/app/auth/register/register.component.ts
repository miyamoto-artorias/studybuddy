import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCardModule,
    MatSelectModule,
    MatRadioModule,
    MatDividerModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  userType: string = 'STUDENT';
  isSubmitting: boolean = false;
  languages: string[] = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Russian', 'Japanese'];
  newLanguage: string = '';
  newExpertise: string = '';
  newQualification: string = '';
  
  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.initializeForm();
  }
  
  initializeForm(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      fullName: ['', Validators.required],
      bio: [''],
      location: [''],
      preferredLanguage: this.fb.array([]),
      socialLinks: this.fb.group({
        linkedin: [''],
        github: [''],
        twitter: ['']
      }),
      expertise: this.fb.array([]),
      qualification: this.fb.array([])
    }, { validators: this.passwordMatchValidator });
  }
  
  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  get preferredLanguage(): FormArray {
    return this.registerForm.get('preferredLanguage') as FormArray;
  }
  
  get expertise(): FormArray {
    return this.registerForm.get('expertise') as FormArray;
  }
  
  get qualification(): FormArray {
    return this.registerForm.get('qualification') as FormArray;
  }
  
  addLanguage(language: string): void {
    if (language && !this.preferredLanguage.value.includes(language)) {
      this.preferredLanguage.push(this.fb.control(language));
      this.newLanguage = '';
    }
  }
  
  removeLanguage(index: number): void {
    this.preferredLanguage.removeAt(index);
  }
  
  addExpertise(expertise: string): void {
    if (expertise && !this.expertise.value.includes(expertise)) {
      this.expertise.push(this.fb.control(expertise));
      this.newExpertise = '';
    }
  }
  
  removeExpertise(index: number): void {
    this.expertise.removeAt(index);
  }
  
  addQualification(qualification: string): void {
    if (qualification && !this.qualification.value.includes(qualification)) {
      this.qualification.push(this.fb.control(qualification));
      this.newQualification = '';
    }
  }
  
  removeQualification(index: number): void {
    this.qualification.removeAt(index);
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }
    
    this.isSubmitting = true;
    
    const formValue = { ...this.registerForm.value };
    delete formValue.confirmPassword;
    formValue.userType = this.userType;
    
    // Convert social links to expected format
    const socialLinks: { [key: string]: string } = {};
    Object.keys(formValue.socialLinks).forEach(key => {
      if (formValue.socialLinks[key]) {
        socialLinks[key] = formValue.socialLinks[key];
      }
    });
    formValue.socialLinks = socialLinks;
    
    // Leave profile picture empty for now
    formValue.profilePicture = '';
    
    console.log('Registration data:', formValue);
    
    if (this.userType === 'STUDENT') {
      this.authService.registerStudent(formValue).subscribe({
        next: (response) => {
          this.handleRegistrationSuccess(response);
        },
        error: (error) => {
          this.handleRegistrationError(error);
        }
      });
    } else {
      this.authService.registerTeacher(formValue).subscribe({
        next: (response) => {
          this.handleRegistrationSuccess(response);
        },
        error: (error) => {
          this.handleRegistrationError(error);
        }
      });
    }
  }
  
  private handleRegistrationSuccess(response: any): void {
    this.isSubmitting = false;
    this.snackBar.open('Registration successful!', 'Close', { duration: 3000 });
    console.log('Registration response:', response);
    this.router.navigate(['/login']);
  }
  
  private handleRegistrationError(error: any): void {
    this.isSubmitting = false;
    console.error('Registration error:', error);
    this.snackBar.open(error.error?.message || 'Registration failed. Please try again.', 'Close', { duration: 5000 });
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
