import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  ActivatePadyatraDto,
  CreatePadyatraDto,
  Padyatra,
  UpdatePadyatraDto
} from '../common/padyatra.model';

/**
 * Manages the yearly Padyatra events.
 *
 * BACKEND API CONTRACT (see docs/admin-module-api.md):
 *   GET    {apiUrl}/padyatra/all           -> Padyatra[]  (every year, newest first)
 *   GET    {apiUrl}/padyatra/active        -> Padyatra    (the single active event)
 *   GET    {apiUrl}/padyatra/{id}          -> Padyatra
 *   POST   {apiUrl}/padyatra/create        -> Padyatra
 *   PUT    {apiUrl}/padyatra/update        -> Padyatra
 *   POST   {apiUrl}/padyatra/activate      -> { success: true }
 *   POST   {apiUrl}/padyatra/deactivate    -> { success: true }
 *   DELETE {apiUrl}/padyatra/delete        -> { success: true }
 *
 * Activating a padyatra makes it the context for registration, attendance,
 * insurance and item distribution. Because each year is a distinct padyatraId,
 * batch ids restart from 1 automatically for every new event.
 */
@Injectable({ providedIn: 'root' })
export class PadyatraService {
  private baseUrl = `${environment.apiUrl}/padyatra`;

  constructor(private http: HttpClient) {}

  /** All padyatra events across every year, newest first. */
  getAll(): Observable<Padyatra[]> {
    return this.http.get<Padyatra[]>(`${this.baseUrl}/all`);
  }

  /** The single currently active padyatra (drives new registrations). */
  getActive(): Observable<Padyatra> {
    return this.http.get<Padyatra>(`${this.baseUrl}/active`);
  }

  getById(padyatraId: number): Observable<Padyatra> {
    return this.http.get<Padyatra>(`${this.baseUrl}/${padyatraId}`);
  }

  create(dto: CreatePadyatraDto): Observable<Padyatra> {
    return this.http.post<Padyatra>(`${this.baseUrl}/create`, dto);
  }

  update(dto: UpdatePadyatraDto): Observable<Padyatra> {
    return this.http.put<Padyatra>(`${this.baseUrl}/update`, dto);
  }

  /** Make one padyatra active; the backend deactivates all others in a transaction. */
  activate(dto: ActivatePadyatraDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/activate`, dto);
  }

  /** Disable the padyatra (set IsActive = 0). Afterwards no padyatra is active. */
  deactivate(dto: ActivatePadyatraDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/deactivate`, dto);
  }

  delete(padyatraId: number, updatedBy: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: { padyatraId, updatedBy }
    };
    return this.http.delete(`${this.baseUrl}/delete`, options);
  }
}
