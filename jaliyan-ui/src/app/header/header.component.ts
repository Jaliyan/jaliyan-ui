import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  private authSubscription: Subscription = new Subscription();
  selectedLang = 'en';

  private langSub!: Subscription;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private languageService: LanguageService) {

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

    this.selectedLang = this.languageService.getCurrentLanguage(); // initialize immediately

    this.languageService.currentLang$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => this.selectedLang = lang);
  }

  ngOnDestroy() {
    // Unsubscribe to prevent memory leaks
    this.authSubscription.unsubscribe();
    this.langSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }

  logout(): void {
    this.authService.logout();
  }
}
