// stop.model.ts
//
// A "Stop" is a halting point along the padyatra route for a specific year's event.
// Stops carry the Google Maps location URL that is shown to the public on the
// Menu Info / Public Info dashboard.

export interface Stop {
  stopId: number;
  /** The padyatra (year) this stop belongs to. */
  padyatraId: number;
  /** Stop name in English. */
  nameEn: string;
  /** Stop name in Gujarati. */
  nameGu: string;
  /** Day number within the padyatra (1-based). */
  dayNumber: number;
  /** ISO date (yyyy-MM-dd) this stop is reached. */
  stopDate?: string;
  /** Ordering of the stop within its day (1-based). */
  sequence: number;
  /** Optional meal slot this stop belongs to (from getMealType). Lets each meal have its own location. */
  mealTypeId?: number | null;
  /** Full Google Maps location URL, e.g. "https://maps.app.goo.gl/...". */
  mapUrl?: string;
  /** Optional latitude parsed/entered for the location. */
  latitude?: number | null;
  /** Optional longitude parsed/entered for the location. */
  longitude?: number | null;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateStopDto {
  padyatraId: number;
  nameEn: string;
  nameGu: string;
  /** Deprecated: stops are now a flat list. Kept optional for backward compat. */
  dayNumber?: number;
  stopDate?: string;
  /** Deprecated: stops are no longer sequenced. Kept optional for backward compat. */
  sequence?: number;
  mealTypeId?: number | null;
  mapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
  createdBy?: string;
}

export interface UpdateStopDto extends CreateStopDto {
  stopId: number;
  updatedBy?: string;
}
