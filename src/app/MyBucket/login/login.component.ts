import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.getCurrentUser();
  }

  getCurrentUser(): any {
    const user = this.authService.getCurrentUser();
    console.log('Current user is:', user);
    return user;
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      console.warn('Form invalid, preventing submission');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;

    console.log('Starting login process...');
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login successful, response:', response);
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.error || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      },
      complete: () => console.log('Login request completed')
    });
    //storing 
    this.authService.getTeacherCourses().subscribe({
      next: (courses) => {  
        console.log('Courses fetched successfully:', courses);
      }
      , error: (error) => {
        console.error('Error fetching courses:', error);
      }
      , complete: () => console.log('Course fetching request completed')
    });
  }
}