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
  markAttendance(payload: {
    padyatriId: number;
    stopId: number;
    isPresent: boolean;
  }): Observable<any> {
    const confirmedBy = this.authService.getUsername();
    const finalPayload = { ...payload, confirmedBy };

    return this.http.post(`${this.baseUrl}/attendance/mark`, finalPayload);
  }

  /**
   * Gets attendance details by stop (optional use)
   */
  getAttendanceDetailsByStop(stopId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/report/${stopId}`);
  }

  /**
   * Deletes a padyatri's attendance from a specific stop
   */
  deletePadyatriByStop(padyatriId: number, stopId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/attendance/${padyatriId}/${stopId}`);
  }
}