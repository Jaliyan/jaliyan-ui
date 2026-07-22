import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateStopDto, Stop, UpdateStopDto } from '../common/stop.model';

/**
 * Manages route stops (with Google Maps location URLs) for a padyatra year.
 *
 * BACKEND API CONTRACT (see docs/admin-module-api.md):
 *   GET    {apiUrl}/stop/byPadyatra/{padyatraId} -> Stop[]  (ordered by day, sequence)
 *   POST   {apiUrl}/stop/create                  -> Stop
 *   PUT    {apiUrl}/stop/update                  -> Stop
 *   DELETE {apiUrl}/stop/delete                  -> { success: true }
 */
@Injectable({ providedIn: 'root' })
export class StopService {
  private baseUrl = `${environment.apiUrl}/stop`;

  constructor(private http: HttpClient) {}

  getByPadyatra(padyatraId: number): Observable<Stop[]> {
    return this.http.get<Stop[]>(`${this.baseUrl}/byPadyatra/${padyatraId}`);
  }

  create(dto: CreateStopDto): Observable<Stop> {
    return this.http.post<Stop>(`${this.baseUrl}/create`, dto);
  }

  update(dto: UpdateStopDto): Observable<Stop> {
    return this.http.put<Stop>(`${this.baseUrl}/update`, dto);
  }

  delete(stopId: number, updatedBy: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: { stopId, updatedBy }
    };
    return this.http.delete(`${this.baseUrl}/delete`, options);
  }
}
