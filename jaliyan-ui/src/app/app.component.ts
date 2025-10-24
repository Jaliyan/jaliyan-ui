import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';
import { LoaderService } from './services/loader.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone:false
})
export class AppComponent {
  title = 'jaliyan-ui';
  get isLoading(): Observable<boolean> {
    return this.loaderService.isLoading$;
  }

  constructor(private router: Router, private authService: AuthService, 
    private route: ActivatedRoute, private loaderService: LoaderService) {}

  ngOnInit() {
    let hasNavigated = false;

    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (hasNavigated) return;

        // Get deepest child route
        let currentRoute = this.route.root;
        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        const data = currentRoute.snapshot.queryParamMap.get('data');
        if (data) {
          hasNavigated = true;
          this.router.navigate(['/infodashboard']);
        } else {
          this.authService.initializeSession();
        }
      });
  }
}
