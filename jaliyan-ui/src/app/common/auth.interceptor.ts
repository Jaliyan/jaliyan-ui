import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { isTokenExpired } from '../common/token.utils';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getJwtToken();
    const apiUrl = environment.apiUrl;

    let request = req;
    if (token) {
      request = this.addTokenHeader(req, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        // 🔥 1️⃣ Ignore login and refreshToken endpoints
        if (
          req.url.includes(`${apiUrl}/auth/login`) ||
          req.url.includes(`${apiUrl}/auth/refreshToken`)
        ) {
          return throwError(() => error);
        }

        // 🔥 2️⃣ Handle token-related errors only for protected routes
        if (error instanceof HttpErrorResponse && error.status === 401) {
          const currentToken = this.authService.getJwtToken();

          if (currentToken && isTokenExpired(currentToken)) {
            return this.handle401Error(request, next);
          } else {
            this.authService.logout();
            return throwError(() => error);
          }
        }

        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addTokenHeader(request, newToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/home']);
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addTokenHeader(request, token!)))
      );
    }
  }
}
