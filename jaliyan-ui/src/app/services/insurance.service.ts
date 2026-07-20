import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { PadyatriService } from './padyatri.service';
import {
  MarkInsurancePayload,
  PadyatriInsurance
} from '../common/insurance.model';

/**
 * Handles the mapping between padyatris and the insurance covers received from
 * the insurance company.
 *
 * BACKEND API CONTRACT (to be implemented server side):
 *   GET  {apiUrl}/insurance/list
 *        -> PadyatriInsurance[]  (every active padyatri + insuranceReceived flag)
 *   POST {apiUrl}/insurance/mark
 *        body: MarkInsurancePayload  (received = true|false toggles the cover)
 *
 * Until those endpoints exist, `useMock` is true: the list is derived from the
 * existing active-padyatri endpoint and the received status is kept in memory so
 * the screen is fully usable during development. Flip `useMock` to false once the
 * API is live.
 */
@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private baseUrl = environment.apiUrl;

  /** Set to false when the real insurance endpoints are available. */
  private useMock = false;

  /** In-memory store of padyatriIds that have received a cover (mock mode only). */
  private receivedIds = new Set<number>();
  private receivedTimes = new Map<number, string>();

  constructor(
    private http: HttpClient,
    private padyatriService: PadyatriService
  ) {}

  /** Returns every active padyatri along with their current insurance status. */
  getInsuranceList(): Observable<PadyatriInsurance[]> {
    if (!this.useMock) {
      return this.http.get<PadyatriInsurance[]>(`${this.baseUrl}/insurance/list`);
    }

    return this.padyatriService.getPadyatris().pipe(
      map(padyatris =>
        padyatris.map(p => {
          const firstName = p.firstName || '';
          const lastName = p.lastName || '';
          return {
            padyatriId: p.padyatriId,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            batchId: p.batchId,
            mobile: p.mobile,
            photoPath: p.photoPath,
            insuranceReceived: this.receivedIds.has(p.padyatriId),
            receivedTime: this.receivedTimes.get(p.padyatriId) ?? null,
            receivedBy: null
          } as PadyatriInsurance;
        })
      )
    );
  }

  /** Marks (or un-marks) an insurance cover as received for a padyatri. */
  markInsurance(payload: MarkInsurancePayload): Observable<any> {
    if (!this.useMock) {
      return this.http.post(`${this.baseUrl}/insurance/mark`, payload);
    }

    return of({ success: true }).pipe(
      tap(() => {
        if (payload.received) {
          this.receivedIds.add(payload.padyatriId);
          this.receivedTimes.set(payload.padyatriId, new Date().toISOString());
        } else {
          this.receivedIds.delete(payload.padyatriId);
          this.receivedTimes.delete(payload.padyatriId);
        }
      })
    );
  }
}
