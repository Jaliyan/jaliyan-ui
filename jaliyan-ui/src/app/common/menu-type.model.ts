// menu-type.model.ts
//
// A "Menu Type" (ભોજન પ્રકાર) is a simple lookup describing the kind of meal
// served, e.g. Breakfast / Lunch / Dinner / Prasad. It is maintained with a
// plain CRUD screen (like Menu Items) and referenced by the Menu Planner.

export interface MenuType {
  menuTypeId?: number;
  /** Display name (shown as-is in the UI, typically Gujarati). */
  name: string;
  isActive?: boolean;
  createdBy?: string;
  updatedBy?: string;
}
