// menu-schedule.model.ts
//
// A "Menu Schedule" is a single planned row in the Menu Planner: on a given
// padyatra date, at a given stop, a menu type (ભોજન પ્રકાર) is served with one
// or more menu items. The `sequenceTime` is used ONLY to order rows within a
// date — it is never displayed in the UI.

export interface MenuScheduleItem {
  menuItemId: number;
  name: string;
}

/** Write model used when creating / updating a planned menu row. */
export interface MenuScheduleDto {
  scheduleId?: number;
  padyatraId: number;
  /** ISO date (yyyy-MM-dd) within the padyatra start..end range. */
  menuDate: string;
  stopId: number;
  /** "HH:mm" used only to order rows within the date. Not shown in UI. */
  sequenceTime: string;
  menuTypeId: number;
  menuItemIds: number[];
  createdBy?: string;
  updatedBy?: string;
}

/** Read model returned by the API with resolved display fields. */
export interface MenuScheduleView {
  scheduleId: number;
  menuDate: string;
  stopId: number;
  stopNameGu: string;
  stopNameEn: string;
  mapUrl?: string;
  sequenceTime: string;
  menuTypeId: number;
  menuTypeName: string;
  menuItems: MenuScheduleItem[];
}
