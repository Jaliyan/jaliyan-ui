import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodItem, MealType, MenuDate } from '../common/fooditem.model';
import { DayItinerary } from '../common/public-info-dashboard.model';
import { MenuScheduleDto, MenuScheduleView } from '../common/menu-schedule.model';

@Injectable({
  providedIn: 'root'
})
export class MenuplannerService {

  private baseUrl = `${environment.apiUrl}/menu`;

  constructor(private http: HttpClient) {}

  getMenuDates(): Observable<MenuDate[]> {
    return this.http.get<MenuDate[]>(`${this.baseUrl}/getMealDate`);
  }

  getMealTypes(): Observable<MealType[]> {
    return this.http.get<MealType[]>(`${this.baseUrl}/getMealType`);
  }

  /* =====================================================================
     Menu Schedule CRUD (Menu Planner). A schedule row = date + stop +
     menu type + menu items, ordered within a date by sequenceTime.
     See docs/menu-planner-refactor-api.md.
     ===================================================================== */

  /** All planned menu rows for a padyatra (defaults to the active one). */
  getSchedules(padyatraId?: number): Observable<MenuScheduleView[]> {
    const q = padyatraId != null ? `?padyatraId=${padyatraId}` : '';
    return this.http.get<MenuScheduleView[]>(`${this.baseUrl}/schedules${q}`);
  }

  createSchedule(dto: MenuScheduleDto): Observable<MenuScheduleView> {
    return this.http.post<MenuScheduleView>(`${this.baseUrl}/createSchedule`, dto);
  }

  updateSchedule(dto: MenuScheduleDto): Observable<MenuScheduleView> {
    return this.http.put<MenuScheduleView>(`${this.baseUrl}/updateSchedule`, dto);
  }

  deleteSchedule(scheduleId: number, updatedBy: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: { scheduleId, updatedBy }
    };
    return this.http.delete(`${this.baseUrl}/deleteSchedule`, options);
  }

  getItinerary(): Observable<DayItinerary[]> {
    return this.http.get<DayItinerary[]>(`${this.baseUrl}/mealItinerary`);
  }

  /**
   * UI-driven itinerary built live from the Menu Planner + Stops.
   * When padyatraId is omitted the backend uses the active padyatra.
   * Same DayItinerary shape as getItinerary(), so the Menu Info screen and the
   * archive can render either. This is what reflects planner edits immediately.
   */
  getItineraryFromPlanner(padyatraId?: number): Observable<DayItinerary[]> {
    const q = padyatraId != null ? `?padyatraId=${padyatraId}` : '';
    return this.http.get<DayItinerary[]>(`${this.baseUrl}/mealItineraryFromPlanner${q}`);
  }
}
