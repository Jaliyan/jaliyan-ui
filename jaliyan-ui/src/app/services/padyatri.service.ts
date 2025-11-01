import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreatePadyatriDto, Padyatri } from '../common/padyatri.model';

@Injectable({
  providedIn: 'root'
})
export class PadyatriService {
  private baseUrl = environment.apiUrl

  constructor(private http: HttpClient) {}

  /**
   * Fetch the list of all Padyatris (padyatris).
   */
  getPadyatris(): Observable<Padyatri[]> {
    return this.http.get<Padyatri[]>(`${this.baseUrl}/padyatri/activePadyatri`);
  }

  /**
   * Fetch a specific Padyatri (padyatri) by ID.
   * @param padyatriId - The ID of the Padyatri to fetch.
   */
  getPadyatriById(padyatriId: number): Observable<Padyatri> {
    return this.http.get<Padyatri>(`${this.baseUrl}/padyatri/getPadyatriById/${padyatriId}`);
  }

  /**
   * Add a new Padyatri (padyatri).
   * @param Padyatri - The Padyatri data to be added.
   */
  addPadyatri(padyatri: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/Padyatri/createPadyatri`, padyatri);
  }

  /**
   * Update an existing Padyatri (padyatri).
   * @param padyatriId - The ID of the Padyatri to update.
   * @param updatedPadyatri - The updated Padyatri data.
   */
  updatePadyatri(updatedPadyatri: FormData): Observable<Padyatri> {
    return this.http.put<Padyatri>(`${this.baseUrl}/padyatri/updatePadyatri`, updatedPadyatri);
  }

  /**
   * Delete a Padyatri (padyatri) by ID.
   * @param PadyatriId - The ID of the Padyatri to delete.
   */
  deletePadyatri(padyatriId: number,updatedBy: string): Observable<any> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      body: {
        padyatriId: padyatriId,
        updatedBy: updatedBy,
      },
    };
  return this.http.delete(`${this.baseUrl}/padyatri/deletePadyatri`, options);
  }

    /**
   * Return a Padyatri (padyatri) by ID.
   * @param PadyatriId - The ID of the Padyatri to return.
   */
  returnPadyatri(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Padyatri/returnPadyatri`, payload);
  }

  getPadyatriImageAsBlob(fileName: string) {
    return this.http.get(`${this.baseUrl}/padyatri/getPadyatriImage/${fileName}`, {
      responseType: 'blob',
    });
  }
}
