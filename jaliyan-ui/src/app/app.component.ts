import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'jaliyan-ui';
  isLoading: boolean = true;

  constructor(private router: Router,private authService: AuthService) {}
  
  ngOnInit() {
  this.authService.initializeSession();
  }
}
