import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  
  private authSubscription: Subscription = new Subscription(); 
  
  constructor(private authService: AuthService) { 

    this.authSubscription = this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;  // Update the login status when the auth state changes
    });
  }

  isLoggedIn: boolean = false;
  isMenuOpen: boolean = false;  // Keeps track of whether the menu is open or closed

  // Method to toggle the menu visibility
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.getJwtToken() == null ? false : true; 
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
    this.authSubscription.unsubscribe();
  }


  logout(): void {
    this.authService.logout();
  }
}
