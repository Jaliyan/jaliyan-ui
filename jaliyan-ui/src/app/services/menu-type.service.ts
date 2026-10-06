import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { MenuType } from '../common/menu-type.model';

/**
 * CRUD for Menu Types (ભોજન પ્રકાર) — a simple lookup used by the Menu Planner.
 *
 * BACKEND API CONTRACT (see docs/menu-planner-refactor-api.md):
 *   GET    {apiUrl}/menu/menuTypes       -> MenuType[]
 *   POST   {apiUrl}/menu/createMenuType  -> MenuType
 *   PUT    {apiUrl}/menu/updateMenuType  -> MenuType
 *   DELETE {apiUrl}/menu/deleteMenuType  -> { success: true }
 */
@Injectable({ providedIn: 'root' })
export class MenuTypeService {
  private baseUrl = `${environment.apiUrl}/menu`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MenuType[]> {
    return this.http.get<MenuType[]>(`${this.baseUrl}/menuTypes`);
  }

  create(item: MenuType): Observable<MenuType> {
    return this.http.post<MenuType>(`${this.baseUrl}/createMenuType`, item);
  }

  update(item: MenuType): Observable<MenuType> {
    return this.http.put<MenuType>(`${this.baseUrl}/updateMenuType`, item);
  }

  delete(menuTypeId: number, updatedBy: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      body: { menuTypeId, updatedBy }
    };
    return this.http.delete(`${this.baseUrl}/deleteMenuType`, options);
  }
}
