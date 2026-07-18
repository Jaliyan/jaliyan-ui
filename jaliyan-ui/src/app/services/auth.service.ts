import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { getUserDetails, isTokenExpired, decodeToken } from '../common/token.utils';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authTokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly apiUrl = environment.apiUrl;

  private tokenTimer: any;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getJwtToken();
    if (token && !isTokenExpired(token)) {
      this.isLoggedInSubject.next(true);
      this.startTokenTimer(token);
      this.currentUserSubject.next(getUserDetails(this.authTokenKey));
    }
  }

  /** ===================== LOGIN ===================== **/
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        map(response => {
          if (response?.token) {
            localStorage.setItem(this.authTokenKey, response.token);

            if (response.refreshToken) {
              localStorage.setItem(this.refreshTokenKey, response.refreshToken);
            }

            this.isLoggedInSubject.next(true);
            this.currentUserSubject.next(response);
            this.startTokenTimer(response.token);
          }
          return response;
        }),
        catchError(error => throwError(() => error))
      );
  }

  /** ===================== LOGOUT ===================== **/
  logout(): void {
    console.log('🚪 Logging out user');
    if (this.tokenTimer) {
      clearTimeout(this.tokenTimer);
    }

    localStorage.removeItem(this.authTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);

    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }

  /** ===================== TOKEN MANAGEMENT ===================== **/
  getJwtToken(): string | null {
    return localStorage.getItem(this.authTokenKey);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  getUsername(): string | null {
    const userDetails = getUserDetails(this.authTokenKey);
    return userDetails ? userDetails.sub : null;
  }

  /** ===================== AUTO REFRESH LOGIC ===================== **/
  private startTokenTimer(token: string): void {
    const decoded: any = decodeToken(token);
    if (!decoded?.exp) return;

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    const refreshTime = expiresAt - now - (60 * 1000); // refresh 1 minute before expiry

    if (refreshTime <= 0) {
      this.handleTokenExpiry();
      return;
    }

    console.log(`⏳ Token will refresh in ${(refreshTime / 1000 / 60).toFixed(1)} minutes`);

    if (this.tokenTimer) clearTimeout(this.tokenTimer);

    this.tokenTimer = setTimeout(() => this.handleTokenExpiry(), refreshTime);
  }

  private handleTokenExpiry(): void {
    const refreshToken = this.getRefreshToken();
    const token = this.getJwtToken();

    if (!token) {
      this.logout();
      return;
    }

    if (!refreshToken) {
      console.warn('⚠️ No refresh token found, logging out');
      this.logout();
      return;
    }

    console.log('🔄 Attempting token refresh...');
    this.refreshToken().subscribe({
      next: (newToken) => {
        console.log('✅ Token refreshed successfully');
        localStorage.setItem(this.authTokenKey, newToken);
        this.startTokenTimer(newToken);
      },
      error: (err) => {
        console.error('❌ Token refresh failed:', err);
        this.logout();
      }
    });
  }

  /** ===================== REFRESH TOKEN ===================== **/
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token available'));

    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/refreshToken`, { refreshToken })
      .pipe(
        map(response => {
          const newToken = response?.token;
          if (newToken) {
            localStorage.setItem(this.authTokenKey, newToken);
            return newToken;
          } else {
            throw new Error('No token in response');
          }
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /** ===================== SESSION INITIALIZER ===================== **/
  initializeSession(): void {
    const token = this.getJwtToken();
    if (token && !isTokenExpired(token)) {
      this.isLoggedInSubject.next(true);
      this.startTokenTimer(token);
    } else {
      this.isLoggedInSubject.next(false);
      // No auto logout — interceptor/guard will handle it
    }
  }
}
