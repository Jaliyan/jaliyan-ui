export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Meal {
  menu?: string[];
  location?: Location;
}

export interface Meals {
  [key: string]: Meal;
}

export interface DayItinerary {
  date: string;  // ISO date string
  meals: Meals;
}