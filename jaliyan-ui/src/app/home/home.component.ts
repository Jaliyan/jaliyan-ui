import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from '../common/token.utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: false,
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) { }

  ngOnInit() {

    const data = this.route.snapshot.queryParamMap.get('data');

    if (!data) {
      this.router.navigate(['/home']); // fallback public page
      return;
    }

    const token = this.auth.getJwtToken();
    const isValid = token && !isTokenExpired(token);

    if (!isValid) {
      // Redirect to login with data param
      this.router.navigate(['/infodashboard']);
      return; // IMPORTANT: stop further execution in this component
    }
  }

  
}
