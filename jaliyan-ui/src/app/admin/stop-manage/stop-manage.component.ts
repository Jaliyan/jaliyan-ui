import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StopService } from '../../services/stop.service';
import { PadyatraService } from '../../services/padyatra.service';
import { MenuplannerService } from '../../services/menuplanner.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Padyatra } from '../../common/padyatra.model';
import { Stop } from '../../common/stop.model';
import { StopFormDialogComponent } from '../stop-form-dialog/stop-form-dialog.component';

interface DayGroup {
  dayNumber: number;
  stops: Stop[];
}

@Component({
  selector: 'app-stop-manage',
  templateUrl: './stop-manage.component.html',
  styleUrls: ['./stop-manage.component.css'],
  standalone: false
})
export class StopManageComponent implements OnInit {
  /** Stops are always managed for the single ACTIVE padyatra. Past years are read-only in the archive. */
  activePadyatra: Padyatra | null = null;
  dayGroups: DayGroup[] = [];
  loading = true;
  userName: string;
  private mealTypeNames = new Map<number, string>();

  constructor(
    private stopService: StopService,
    private padyatraService: PadyatraService,
    private menuService: MenuplannerService,
    private toast: ToastService,
    private auth: AuthService,
    private dialog: MatDialog
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.loading = true;
    this.menuService.getMealTypes().subscribe({
      next: (types) => (types ?? []).forEach(t => this.mealTypeNames.set(t.mealTypeId, t.name)),
      error: () => {}
    });
    this.padyatraService.getActive().subscribe({
      next: (p) => {
        this.activePadyatra = p ?? null;
        if (this.activePadyatra) {
          this.loadStops();
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.activePadyatra = null;
        this.loading = false;
      }
    });
  }

  loadStops(): void {
    if (!this.activePadyatra) {
      this.dayGroups = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.stopService.getByPadyatra(this.activePadyatra.padyatraId).subscribe({
      next: (stops) => {
        this.dayGroups = this.groupByDay(stops ?? []);
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load stops.', 'error');
        this.loading = false;
      }
    });
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

  openForm(stop?: Stop): void {
    if (!this.activePadyatra) {
      this.toast.show('Activate a padyatra first.', 'warning');
      return;
    }
    const ref = this.dialog.open(StopFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        padyatraId: this.activePadyatra.padyatraId,
        stop: stop ? { ...stop } : null
      }
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) this.loadStops();
    });
  }

  remove(stop: Stop): void {
    const ok = confirm(`Delete stop "${stop.nameEn}" (Day ${stop.dayNumber})?`);
    if (!ok) return;
    this.stopService.delete(stop.stopId, this.userName).subscribe({
      next: () => {
        this.toast.show('Stop deleted.', 'success');
        this.loadStops();
      },
      error: () => this.toast.show('Failed to delete stop.', 'error')
    });
  }

  openMap(stop: Stop): void {
    if (stop.mapUrl) window.open(stop.mapUrl, '_blank', 'noopener');
  }

  mealTypeName(stop: Stop): string {
    return stop.mealTypeId != null ? (this.mealTypeNames.get(stop.mealTypeId) ?? '') : '';
  }
}
