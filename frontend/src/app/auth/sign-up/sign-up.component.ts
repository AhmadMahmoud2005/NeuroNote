import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  username = '';
  fullName = '';
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    // Lowercase and strip out any character except lowercase letters, numbers, and hyphens
    this.username = input.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.router.navigate(['/all-pages']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 409) {
          this.errorMessage = 'A user with this email or username already exists.';
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please try again.';
        } else {
          this.errorMessage = err.error?.message || 'An unexpected error occurred.';
        }
      }
    });
  }
}
