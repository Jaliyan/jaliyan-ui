import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface ItemDistributionPayload {
  padyatriId: number;
  stopId: number;
  itemId: number;
  distributedBy: string;
}

@Injectable({ providedIn: 'root' })
export class DistributionService {

  constructor(private http: HttpClient) {}

   /**
   * Revoke an already given item (undo)
   */
  revokeItem(payload: ItemDistributionPayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/revoke`, payload);
  }

  /**
   * Mark item distribution (used by attendance/item combined screen)
   * This is essentially an alias to giveItem() but keeps naming consistent
   */
  markItemDistribution(payload: ItemDistributionPayload): Observable<any> {
    return this.http.post(`${environment.apiUrl}/itemdistribution/mark`, payload);
  }

  /**
   * Optional helper to view history for a padyatri
   */
  getDistributionHistory(padyatriId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/history/${padyatriId}`);
  }

   getItems(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/itemdistribution/items`);
  }

  getItemDistribution(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/itemdistribution/distribution`);
  }
}
