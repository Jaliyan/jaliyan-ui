import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private baseUrl = environment.apiUrl;
  confirmedBy : any;

  constructor(private http: HttpClient, private authService: AuthService) {}
  // Mark the attendance of a user
  markAttendance(padyatriId: number, isPresent: boolean, stopId: number): Observable<any> {
    this.confirmedBy = this.authService.getUsername();
    let confirmedBy = this.confirmedBy;
    return this.http.post(`${this.baseUrl}/attendance/mark`, { padyatriId, stopId, isPresent, confirmedBy });
  }

  // Fetch attendance details for all user by stop (if needed)
  getAttendanceDetailsByStop(stopId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/report/${stopId}`);
  }

  deletePadyatriByStop(padyatriId: number, stopId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attendance/${padyatriId}/${stopId}`);
  }
}
