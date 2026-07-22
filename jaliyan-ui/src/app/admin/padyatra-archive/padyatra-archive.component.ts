import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PadyatraService } from '../../services/padyatra.service';
import { PadyatriService } from '../../services/padyatri.service';
import { StopService } from '../../services/stop.service';
import { MenuplannerService } from '../../services/menuplanner.service';
import { ToastService } from '../../services/toast.service';
import { Padyatra } from '../../common/padyatra.model';
import { Padyatri } from '../../common/padyatri.model';
import { Stop } from '../../common/stop.model';
import { DayItinerary } from '../../common/public-info-dashboard.model';

interface DayGroup {
  dayNumber: number;
  stops: Stop[];
}

/**
 * Read-only archive: pick a padyatra (year) and review its registrations, stops
 * and planned menus. Lets organizers look back at 2025, 2026, ... independently.
 */
@Component({
  selector: 'app-padyatra-archive',
  templateUrl: './padyatra-archive.component.html',
  styleUrls: ['./padyatra-archive.component.css'],
  standalone: false
})
export class PadyatraArchiveComponent implements OnInit {
  padyatras: Padyatra[] = [];
  selectedPadyatraId: number | null = null;

  padyatris: Padyatri[] = [];
  dayGroups: DayGroup[] = [];
  itinerary: DayItinerary[] = [];

  loadingList = true;
  loadingData = false;

  displayedColumns = ['batchId', 'name', 'mobile', 'age'];

  constructor(
    private padyatraService: PadyatraService,
    private padyatriService: PadyatriService,
    private stopService: StopService,
    private menuService: MenuplannerService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.padyatraService.getAll().subscribe({
      next: (data) => {
        this.padyatras = data ?? [];
        const active = this.padyatras.find(p => p.isActive);
        this.selectedPadyatraId = active?.padyatraId ?? (this.padyatras[0]?.padyatraId ?? null);
        this.loadingList = false;
        if (this.selectedPadyatraId) this.loadData();
      },
      error: () => {
        this.toast.show('Failed to load padyatra list.', 'error');
        this.loadingList = false;
      }
    });
  }

  get selectedPadyatra(): Padyatra | null {
    return this.padyatras.find(p => p.padyatraId === this.selectedPadyatraId) ?? null;
  }

  onPadyatraChange(): void {
    this.loadData();
  }

  loadData(): void {
    if (!this.selectedPadyatraId) return;
    const id = this.selectedPadyatraId;
    this.loadingData = true;

    forkJoin({
      padyatris: this.padyatriService.getPadyatrisByPadyatra(id),
      stops: this.stopService.getByPadyatra(id),
      menus: this.menuService.getItineraryFromPlanner(id)
    }).subscribe({
      next: ({ padyatris, stops, menus }) => {
        this.padyatris = padyatris ?? [];
        this.dayGroups = this.groupByDay(stops ?? []);
        this.itinerary = this.mapItinerary(menus ?? []);
        this.loadingData = false;
      },
      error: () => {
        this.toast.show('Failed to load archive data for this year.', 'error');
        this.padyatris = [];
        this.dayGroups = [];
        this.itinerary = [];
        this.loadingData = false;
      }
    });
  }

  /** Convert the dictionary-shaped meals into a sorted array (same as Menu Info). */
  private mapItinerary(data: DayItinerary[]): DayItinerary[] {
    return (data ?? []).map(day => ({
      date: day.date,
      meals: Object.entries(day.meals as any)
        .map(([key, meal]: [string, any]) => ({ ...meal, type: key.split('_')[1] }))
        .sort((a: any, b: any) => a.id - b.id)
    })) as any;
  }

  private groupByDay(stops: Stop[]): DayGroup[] {
    const map = new Map<number, Stop[]>();
    for (const s of stops) {
      const day = s.dayNumber ?? 1;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(s);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayNumber, list]) => ({
        dayNumber,
        stops: list.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      }));
  }
}
