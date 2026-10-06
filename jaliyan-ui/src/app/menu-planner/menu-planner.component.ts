import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { MenuplannerService } from '../services/menuplanner.service';
import { FooditemsService } from '../services/fooditems.service';
import { MenuTypeService } from '../services/menu-type.service';
import { StopService } from '../services/stop.service';
import { PadyatraService } from '../services/padyatra.service';
import { ToastService } from '../services/toast.service';
import { FoodItem } from '../common/fooditem.model';
import { MenuType } from '../common/menu-type.model';
import { Stop } from '../common/stop.model';
import { Padyatra } from '../common/padyatra.model';
import { MenuScheduleDto, MenuScheduleView } from '../common/menu-schedule.model';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { formatGujaratiDate } from '../common/number-utils';

/** A selectable padyatra date (yyyy-MM-dd + Gujarati label, no time). */
interface PlannerDate {
  value: string;
  label: string;
}

/** Planned rows grouped by date for display. */
interface ScheduleGroup {
  date: string;
  label: string;
  rows: MenuScheduleView[];
}

@Component({
  selector: 'app-menu-planner',
  templateUrl: './menu-planner.component.html',
  styleUrls: ['./menu-planner.component.css'],
  standalone: false
})
export class MenuPlannerComponent implements OnInit {
  menuForm!: FormGroup;

  activePadyatra: Padyatra | null = null;
  plannerDates: PlannerDate[] = [];
  stops: Stop[] = [];
  menuTypes: MenuType[] = [];
  menuItems: FoodItem[] = [];
  filteredMenuItems: FoodItem[] = [];

  itemFilterCtrl: FormControl = new FormControl('');
  scheduleGroups: ScheduleGroup[] = [];
  scheduleCount = 0;
  editingId: number | null = null;
  saving = false;
  loading = true;
  userName: any;

  /** Static 30-minute time slots used to order menus within a date. */
  timeOptions: { value: string; label: string }[] = this.buildTimeOptions();

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  constructor(
    private fb: FormBuilder,
    private menuService: MenuplannerService,
    private foodService: FooditemsService,
    private menuTypeService: MenuTypeService,
    private stopService: StopService,
    private padyatraService: PadyatraService,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.userName = this.authService.getUsername();
  }

  ngOnInit(): void {
    this.menuForm = this.fb.group({
      menuDate: ['', Validators.required],
      stopId: ['', Validators.required],
      sequenceTime: ['', Validators.required],
      menuTypeId: ['', Validators.required],
      menuItemIds: [[], Validators.required]
    });

    this.padyatraService.getActive().subscribe({
      next: (p) => {
        this.activePadyatra = p ?? null;
        this.plannerDates = this.buildDateRange(p ?? null);
        if (this.activePadyatra) {
          this.loadDropdownData();
          this.loadSchedules();
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.activePadyatra = null;
        this.loading = false;
      }
    });

    this.itemFilterCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.filterMenuItems(search);
    });
  }

  /** Builds 48 half-hour slots ("00:00".."23:30") with 12-hour labels. */
  private buildTimeOptions(): { value: string; label: string }[] {
    const opts: { value: string; label: string }[] = [];
    for (let m = 0; m < 24 * 60; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const value = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const period = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
      opts.push({ value, label });
    }
    return opts;
  }

  /** Builds the inclusive list of dates between the padyatra start and end. */
  private buildDateRange(p: Padyatra | null): PlannerDate[] {
    if (!p?.startDate || !p?.endDate) return [];
    const dates: PlannerDate[] = [];
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = this.toIsoDate(d);
      dates.push({ value: iso, label: formatGujaratiDate(iso) });
    }
    return dates;
  }

  private toIsoDate(value: Date): string {
    const tzOffset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - tzOffset).toISOString().slice(0, 10);
  }

  loadDropdownData(): void {
    if (this.activePadyatra) {
      this.stopService.getByPadyatra(this.activePadyatra.padyatraId)
        .subscribe(stops => this.stops = stops ?? []);
    }
    this.menuTypeService.getAll().subscribe(types => this.menuTypes = types ?? []);
    this.foodService.getItems().subscribe(items => {
      this.menuItems = items ?? [];
      this.filteredMenuItems = this.menuItems;
    });
  }

  filterMenuItems(search: string | null): void {
    const filterValue = (search ?? '').toLowerCase();
    if (!filterValue) {
      this.filteredMenuItems = this.menuItems;
    } else {
      this.filteredMenuItems = this.menuItems.filter(item =>
        item.name.toLowerCase().includes(filterValue) ||
        (item.description ?? '').toLowerCase().includes(filterValue)
      );
    }
  }

  loadSchedules(): void {
    if (!this.activePadyatra) {
      this.scheduleGroups = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.menuService.getSchedules(this.activePadyatra.padyatraId).subscribe({
      next: (rows) => {
        this.scheduleGroups = this.groupSchedules(rows ?? []);
        this.scheduleCount = rows?.length ?? 0;
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load planned menus.', 'error');
        this.loading = false;
      }
    });
  }

  /** Groups schedule rows by date and orders both dates and rows by sequence. */
  private groupSchedules(rows: MenuScheduleView[]): ScheduleGroup[] {
    const map = new Map<string, MenuScheduleView[]>();
    for (const r of rows) {
      const key = (r.menuDate || '').slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, list]) => ({
        date,
        label: formatGujaratiDate(date),
        rows: list.sort((a, b) => (a.sequenceTime || '').localeCompare(b.sequenceTime || ''))
      }));
  }

  edit(row: MenuScheduleView): void {
    this.editingId = row.scheduleId;
    this.menuForm.patchValue({
      menuDate: (row.menuDate || '').slice(0, 10),
      stopId: row.stopId,
      sequenceTime: (row.sequenceTime || '').slice(0, 5),
      menuTypeId: row.menuTypeId,
      menuItemIds: (row.menuItems || []).map(i => i.menuItemId)
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.formDir?.resetForm({ menuDate: '', stopId: '', sequenceTime: '', menuTypeId: '', menuItemIds: [] });
    this.menuForm.reset({ menuDate: '', stopId: '', sequenceTime: '', menuTypeId: '', menuItemIds: [] });
    this.itemFilterCtrl.setValue('');
  }

  onSubmit(): void {
    if (!this.activePadyatra) {
      this.toast.show('Activate a padyatra first.', 'warning');
      return;
    }
    if (this.menuForm.invalid || this.saving) {
      this.menuForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.menuForm.value;
    const dto: MenuScheduleDto = {
      padyatraId: this.activePadyatra.padyatraId,
      menuDate: v.menuDate,
      stopId: v.stopId,
      sequenceTime: v.sequenceTime,
      menuTypeId: v.menuTypeId,
      menuItemIds: v.menuItemIds,
      createdBy: this.userName,
      updatedBy: this.userName
    };

    const request$ = this.editingId
      ? this.menuService.updateSchedule({ ...dto, scheduleId: this.editingId })
      : this.menuService.createSchedule(dto);

    request$.subscribe({
      next: () => {
        this.toast.show(this.editingId ? 'Menu updated.' : 'Menu saved.', 'success');
        this.saving = false;
        this.cancelEdit();
        this.loadSchedules();
      },
      error: () => {
        this.saving = false;
        this.toast.show('Failed to save menu.', 'error');
      }
    });
  }

  remove(row: MenuScheduleView): void {
    const ok = confirm('Delete this planned menu?');
    if (!ok) return;
    this.menuService.deleteSchedule(row.scheduleId, this.userName).subscribe({
      next: () => {
        this.toast.show('Menu deleted.', 'success');
        if (this.editingId === row.scheduleId) this.cancelEdit();
        this.loadSchedules();
      },
      error: () => this.toast.show('Failed to delete menu.', 'error')
    });
  }

  itemNames(row: MenuScheduleView): string {
    return (row.menuItems || []).map(i => i.name).join(', ');
  }
}
