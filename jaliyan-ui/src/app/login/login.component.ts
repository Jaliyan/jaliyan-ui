import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.authService.login(this.username, this.password)
      .subscribe({
        next: (data) => { 
          this.router.navigate(['/attendance']);  // Navigate to a secure page
        },
        error: (err) => {
          alert('Login failed!');
        }
      });
  }
}