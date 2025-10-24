import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { isTokenExpired } from '../common/token.utils';
import { environment } from '../environments/environment';
import { ToastService } from '../services/toast.service';
import { QueryParamsService } from '../services/queryparams.service';
import { LoaderService } from '../services/loader.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private queryParamsService: QueryParamsService,
    private loaderService: LoaderService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getJwtToken();
    const isValid = token && !isTokenExpired(token);
    const dataParam = this.queryParamsService.getCurrentQueryParam('data');
    const apiUrl = environment.apiUrl;

    let request = req;
    if (token) {
      request = this.addTokenHeader(req, token);
    }

    this.loaderService.show();
    
    return next.handle(request).pipe(
      finalize(() => this.loaderService.hide()),
      catchError(error => {
        // Skip login/refreshToken APIs
        if (
          req.url.includes(`${apiUrl}/auth/login`) ||
          req.url.includes(`${apiUrl}/auth/refreshToken`)
        ) {
          return throwError(() => error);
        }

        // Case 1: ?data param present → redirect to info dashboard
        if (dataParam && (!token || isTokenExpired(token))) {
          this.router.navigate(['/infodashboard']);
          return throwError(() => error);
        }

        // Case 2: Unauthorized error (token invalid or expired)
        if (error instanceof HttpErrorResponse && error.status === 401) {
          if (token && isTokenExpired(token)) {
            return this.handle401Error(request, next);
          } else {
            this.handleInvalidSession();
          }
        }

        return throwError(() => error);
      })
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
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
          this.handleInvalidSession(true);
          return throwError(() => err);
        })
      );
    } else {
      // Wait for refresh to complete
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addTokenHeader(request, token!)))
      );
    }
  }

  private handleInvalidSession(showToast = false): void {
    this.authService.logout();
    if (showToast) {
      this.toastService.show('Login expired. Please login again.', 'error');
    }
    this.router.navigate(['/login']);
  }
}
