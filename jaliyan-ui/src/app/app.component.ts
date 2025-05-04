import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'jaliyan-ui';
  isLoading: boolean = true;

  constructor(private router: Router) {}
  
  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false; // Hide the spinner
      this.router.navigate(['/home']); // Navigate to Home Component after spinner hides
    }, 2000); // Simulate loading for 2 seconds
  }
}
