import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodItem, MealType, MenuDate } from '../common/fooditem.model';

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
}
