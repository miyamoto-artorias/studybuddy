import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule,ReactiveFormsModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  logout() {
    this.authService.logout();
  }
  onSubmit(): void {
    if (this.loginForm.invalid) return;
    
    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => this.router.navigate(['pages/dashboard/courses']),
      error: (error) => {
        this.loginForm.reset();
        this.isLoading = false;
        alert(error.error?.message || 'Login failed');
      },
      complete: () => this.isLoading = false
    });
  }
}