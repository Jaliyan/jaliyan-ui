import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { isTokenExpired } from './token.utils';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this.authService.getJwtToken();
    
    if (token && isTokenExpired(token)) {
      return this.authService.refreshToken().pipe(
        switchMap(() => {
          token = this.authService.getJwtToken();
          const clonedRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          return next.handle(clonedRequest);
        }),
        catchError((err) => {
          this.authService.logout();
          return of(err); // Return the error observable if the refresh token fails
        })
      );
    }

    if (token) {
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(clonedRequest);
    }

    return next.handle(req);
  }
}
