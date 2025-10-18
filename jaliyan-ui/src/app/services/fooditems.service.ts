import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FoodItem } from '../common/fooditem.model';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})

export class FooditemsService {

  private baseUrl = `${environment.apiUrl}/menu`;
  
  constructor(private http: HttpClient) {
    
  }

  getItems(): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.baseUrl}/getAllMenuItems`);
  }

  addItem(item: FoodItem): Observable<FoodItem> {
    return this.http.post<FoodItem>(`${this.baseUrl}/createMenuItem`, item);
  }

  updateItem(id: number, item: FoodItem): Observable<FoodItem> {
    return this.http.put<FoodItem>(`${this.baseUrl}/updateMenuItem`, item);
  }

  deleteItem(item: FoodItem): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: {
        menuItemId: item.menuItemId,
        updatedBy: item.updatedBy,
      },
    };
    return this.http.delete(`${this.baseUrl}/deleteMenuItem`, options);
  }
}
