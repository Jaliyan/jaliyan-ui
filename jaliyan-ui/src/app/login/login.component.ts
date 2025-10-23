import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {}

  onLogin(): void {
    if (!this.username || !this.password) return;

    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        this.loading = false;

        // Store token or session (example: localStorage/sessionStorage)
        if (this.rememberMe) {
          localStorage.setItem('token', data.token); // adjust based on real API
        } else {
          sessionStorage.setItem('token', data.token);
        }

        this.router.navigate(['/padyatri/list']); // Redirect after login
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show("Login failed! Please check the credentials.","error")
      }
    });
  }
}
