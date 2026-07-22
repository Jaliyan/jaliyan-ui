import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodItem, MealType, MenuDate } from '../common/fooditem.model';
import { DayItinerary } from '../common/public-info-dashboard.model';

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
  saveMenu(menu: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/createMenuSchedule`, menu);
  }

   getPlannedMenus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/grouped-menu`);
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
