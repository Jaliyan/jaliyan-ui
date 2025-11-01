import { Component, OnInit } from '@angular/core';
import { DayItinerary, Meal } from '../common/public-info-dashboard.model';
import { MenuplannerService } from '../services/menuplanner.service';

@Component({
  selector: 'app-public-info-dashboard',
  templateUrl: './public-info-dashboard.component.html',
  styleUrls: ['./public-info-dashboard.component.css'],
  standalone: false
})
export class PublicInfoDashboardComponent implements OnInit {
  itinerary: DayItinerary[] = [];
  loading = true;
  error: string | null = null;

  constructor(private menuplanner: MenuplannerService) {}

  ngOnInit(): void {
    this.menuplanner.getItinerary().subscribe({
      next: (data) => {
        // Convert meals object to array and sort by id
        this.itinerary = data.map(day => ({
          date: day.date,
          meals: Object.entries(day.meals)
            .map(([type, meal]) => ({ ...meal, type })) // add type from key
            .sort((a, b) => a.id - b.id)               // sort by id
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'માહિતી લોડ કરવામાં મુશ્કેલી આવી.';
        this.loading = false;
      }
    });
  }
}
