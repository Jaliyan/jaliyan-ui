import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isTokenExpired } from '../common/token.utils';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn: boolean = false;
  private apiUrl = environment.apiUrl;
  private authToken = 'auth_token';
  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public currentUser: Observable<any> = this.currentUserSubject.asObservable();
  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient,private router: Router) {
    const user = localStorage.getItem(this.authToken);
    this.isLoggedInSubject.next(!!user);
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        map(response => {
          if (response && response.token) {
            localStorage.setItem(this.authToken, response.token);
            this.currentUserSubject.next(response);
            this.isLoggedInSubject.next(true);
          }
          return response;
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  logout() {
    localStorage.removeItem(this.authToken);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  getJwtToken() {
    return localStorage.getItem(this.authToken);
  }

  isAuthenticated(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();  // Return the observable to subscribe to
  }

  refreshToken() {
    const token = this.getJwtToken();
    if (token && isTokenExpired(token)) {
      return this.http.post<any>(`${this.apiUrl}/refreshToken`, { token })
        .pipe(
          map(response => {
            if (response && response.token) {
              localStorage.setItem(this.authToken, response.token);
              this.currentUserSubject.next(response);
            }
            return response;
          }),
          catchError(error => {
            this.logout();
            throw error;
          })
        );
    }
    return new Observable();
  }
}
