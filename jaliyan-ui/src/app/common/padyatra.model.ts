// padyatra.model.ts
//
// A "Padyatra" is the yearly pilgrimage event itself (not an individual walker).
// Every year a brand new Padyatra record is created. Because batch ids, attendance,
// insurance and item distribution are all scoped to a single padyatraId, the batch
// numbering naturally restarts from 1 for each new year's event.

export interface Padyatra {
  padyatraId: number;
  /** Event name in English, e.g. "Jaliyan Padyatra". */
  nameEn: string;
  /** Event name in Gujarati, e.g. "જલિયાણ પદયાત્રા". */
  nameGu: string;
  /** Calendar year of the event, e.g. 2026. Unique per year. */
  year: number;
  /** ISO date (yyyy-MM-dd) the padyatra starts, e.g. "2026-12-17". */
  startDate: string;
  /** ISO date (yyyy-MM-dd) the padyatra ends, e.g. "2026-12-20". */
  endDate: string;
  /** Only one padyatra may be active at a time. The active one drives registration. */
  isActive: boolean;
  /** Optional descriptive note (English). */
  descriptionEn?: string;
  /** Optional descriptive note (Gujarati). */
  descriptionGu?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Read-only counters returned by the API for the admin dashboard. */
  totalRegistrations?: number;
  totalStops?: number;
}

export interface CreatePadyatraDto {
  nameEn: string;
  nameGu: string;
  year: number;
  startDate: string;
  endDate: string;
  descriptionEn?: string;
  descriptionGu?: string;
  createdBy?: string;
}

export interface UpdatePadyatraDto extends CreatePadyatraDto {
  padyatraId: number;
  updatedBy?: string;
}

export interface ActivatePadyatraDto {
  padyatraId: number;
  updatedBy?: string;
}
