export interface FoodItem {
  menuItemId?: number;
  name: string;
  description: string;
  createdBy?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface MenuDate {
  mealDateId: number;
  menuDate: string; // e.g. "2025-05-05T00:00:00"
  createdBy?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface MealType {
  mealTypeId: number;
  name: string; // e.g. Breakfast
  fromTime: string;
  toTime: string;
  createdBy?: string;
  isActive?: boolean;
  updatedBy?: string;
}
