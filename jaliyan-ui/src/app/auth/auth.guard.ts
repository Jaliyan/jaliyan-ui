import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from '../common/token.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.authService.getJwtToken();
    const dataParam = next.queryParamMap.get('data');

    if (token && !isTokenExpired(token)) {
      return true;
    } else {
      if (dataParam) {
        this.router.navigate(['/infodashboard']);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }
  }
}
