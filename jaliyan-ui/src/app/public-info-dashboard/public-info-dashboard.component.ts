import { Component } from '@angular/core';
import { DayItinerary } from '../common/public-info-dashboard.model';

@Component({
  selector: 'app-public-info-dashboard',
  standalone: false,
  templateUrl: './public-info-dashboard.component.html',
  styleUrl: './public-info-dashboard.component.css'
})
export class PublicInfoDashboardComponent {

 itinerary: DayItinerary[] = [
    {
      date: '2025-12-18',
      meals: {
        breakfast: {
          menu: ['Gathiya', 'Jalebi', 'Sev', 'Khandvi', 'Fafda', 'Dhokla', 'Thepla', 'Poha', 'Kachori', 'Chai'],
          location: { name: 'Location', lat: 12.9716, lng: 77.5946 }
        },
        breakfast2: {
          menu: ['Vadapav', 'Water','Chai'],
          location: { name: 'Location', lat: 12.2958, lng: 76.6394 }
        },
        lunch: {
          menu: ['Gathiya', 'Jalebi','Mohanthal', 'Bateta nu shak','Panner subji','Dal','Bhat','Pani','Mukhwas'],
          location: { name: 'Location', lat: 11.0168, lng: 76.9558 }
        },
        hiTea: {
          menu: ['Pani Puri', 'Chat Puri','Bhel Puri', 'Pani'],
          location: { name: 'Location', lat: 13.0827, lng: 80.2707 }
        },
        dinner: {
          menu: ['Pulav','Pavbhaji','Panch Ratna Halwa','Kadhi', 'Khichadi','Panner Sabji', 'Oro', 'Rotlo', 'Chass', 'Papad'],
          location: { name: 'Location', lat: 10.8505, lng: 76.2711 }
        }
      }
    },
    {
      date: '2025-12-19',
      meals: {
        breakfast: {
          menu: ['Gathiya', 'Jalebi'],
          location: { name: 'Location', lat: 12.9716, lng: 77.5946 }
        },
        breakfast2: {
          menu: ['Vadapav'],
          location: { name: 'Location', lat: 12.2958, lng: 76.6394 }
        },
        lunch: {
          menu: ['Bhojan'],
          location: { name: 'Location', lat: 11.0168, lng: 76.9558 }
        },
        hiTea: {
          menu: ['Puri'],
          location: { name: 'Location', lat: 13.0827, lng: 80.2707 }
        },
        dinner: {
          menu: ['Bhajiya'],
          location: { name: 'Location', lat: 10.8505, lng: 76.2711 }
        }
      }
    }
  ];

  mealTypeLabel(key: string): string {
    const map: Record<string, string> = {
      breakfast: 'Morning Breakfast',
      breakfast2: 'Breakfast',
      lunch: 'Lunch',
      hiTea: 'HiTea',
      dinner: 'Dinner'
    };
    return map[key] || key;
  }
}
