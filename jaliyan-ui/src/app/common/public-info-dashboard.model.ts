export interface Location {
  name: string;
  lat: number;
  lng: number;
}

export interface Meal {
  id: number;
  type: string;      // meal name in Gujarati
  menu: string[];
  location?: Location;
}

export interface DayItinerary {
  date: string;      
  meals: Meal[];     // now meals is an array
}
