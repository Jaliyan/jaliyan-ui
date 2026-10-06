import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { englishToGujaratiDigits, gujaratiToEnglishDigits } from '../../common/number-utils';
import { getAvatarVariant, getNameInitials } from '../../common/avatar-utils';
import { DataGridColumn, DataGridQuickFilter } from './data-grid.types';

/**
 * Reusable, configuration-driven data grid shared across list screens
 * (padyatri, attendance, reports, insurance...). Provides a premium desktop
 * table and a mobile-first card view with global search, per-column filters,
 * sorting and pagination — all themed to the Sandy Shores design system.
 */
@Component({
  selector: 'app-data-grid',
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.css'],
  standalone: false
})
export class DataGridComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() columns: DataGridColumn[] = [];
  @Input() data: any[] = [];

  @Input() searchable = true;
  @Input() searchPlaceholder = 'SearchByNameOrBatch';
  /** Optional custom global-search predicate (e.g. the shared padyatri search). */
  @Input() searchPredicate?: (row: any, term: string) => boolean;

  @Input() quickFilters: DataGridQuickFilter[] = [];

  /** Template rendered in the actions column / mobile card footer. */
  @Input() actionsTemplate: TemplateRef<any> | null = null;
  @Input() actionsHeader = 'Actions';

  /** Row click handler (used by the mobile card). */
  @Input() rowClick?: (row: any) => void;

  @Input() pageSize = 5;
  @Input() pageSizeOptions: number[] = [5, 10, 25];

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];

  searchTerm = '';
  activeQuickFilter = 'all';
  /** Excel-style per-column value selections (checked values). */
  columnSelections: Record<string, Set<string>> = {};
  /** In-menu search text per column. */
  menuSearch: Record<string, string> = {};
  /** Column whose filter menu is currently open. */
  activeMenuColumn: DataGridColumn | null = null;
  private distinctCache: Record<string, string[]> = {};

  isMobile = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .subscribe(result => (this.isMobile = result.matches));
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = this.gridFilterPredicate;
    this.dataSource.sortingDataAccessor = this.gridSortAccessor;
    this.syncData();
    this.rebuildColumns();
    this.applyFilter();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.syncData();
      this.applyFilter();
    }
    if (changes['columns'] || changes['actionsTemplate']) {
      this.rebuildColumns();
    }
  }

  private syncData(): void {
    this.dataSource.data = this.data ?? [];
    this.distinctCache = {};
    this.columnSelections = {};
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private rebuildColumns(): void {
    this.displayedColumns = [
      ...this.columns.map(c => c.key),
      ...(this.actionsTemplate ? ['__actions'] : [])
    ];
  }

  /** Columns that own a per-column filter input. */
  get hasColumnFilters(): boolean {
    return this.columns.some(c => c.filterable);
  }

  get totalCount(): number {
    return this.dataSource.data.length;
  }

  get quickFilterOptions(): DataGridQuickFilter[] {
    if (!this.quickFilters.length) {
      return [];
    }
    const hasAll = this.quickFilters.some(f => f.key === 'all');
    return hasAll
      ? this.quickFilters
      : [{ key: 'all', label: 'All', translate: true }, ...this.quickFilters];
  }

  // ---------- filtering ----------

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  setQuickFilter(key: string): void {
    this.activeQuickFilter = key;
    this.applyFilter();
  }

  private applyFilter(): void {
    // Only columns with an active (strict-subset) selection are filtered.
    const values: Record<string, string[]> = {};
    for (const col of this.columns) {
      if (this.isColumnFiltered(col.key)) {
        values[col.key] = Array.from(this.columnSelections[col.key]);
      }
    }
    // A JSON token so MatTableDataSource always re-runs the predicate.
    this.dataSource.filter = JSON.stringify({
      s: this.searchTerm.trim().toLowerCase(),
      q: this.activeQuickFilter,
      v: values
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private gridFilterPredicate = (row: any, filter: string): boolean => {
    let state: { s: string; q: string; v: Record<string, string[]> };
    try {
      state = JSON.parse(filter);
    } catch {
      return true;
    }

    // Quick filter chip.
    if (state.q && state.q !== 'all') {
      const chip = this.quickFilters.find(f => f.key === state.q);
      if (chip?.predicate && !chip.predicate(row)) {
        return false;
      }
    }

    // Excel-style per-column value filters.
    for (const [key, allowed] of Object.entries(state.v || {})) {
      const col = this.columns.find(c => c.key === key);
      if (!col) {
        continue;
      }
      if (!allowed.includes(this.getCellText(col, row))) {
        return false;
      }
    }

    // Global search.
    const s = state.s ?? '';
    if (!s) {
      return true;
    }
    if (this.searchPredicate) {
      return this.searchPredicate(row, s);
    }
    const haystack = this.columns.map(c => this.cellHaystack(c, row)).join(' ');
    return haystack.includes(this.normalizeDigits(s));
  };

  // ---------- Excel-style column filter menu ----------

  openColumnMenu(col: DataGridColumn): void {
    this.activeMenuColumn = col;
  }

  /** Distinct display values for a column (from the full data set). */
  private getDistinctValues(col: DataGridColumn): string[] {
    if (this.distinctCache[col.key]) {
      return this.distinctCache[col.key];
    }
    const seen = new Set<string>();
    for (const row of this.dataSource.data) {
      seen.add(this.getCellText(col, row));
    }
    const values = Array.from(seen).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
    this.distinctCache[col.key] = values;
    return values;
  }

  /** Distinct values filtered by the in-menu search box. */
  getVisibleDistinct(col: DataGridColumn): string[] {
    const term = (this.menuSearch[col.key] ?? '').trim().toLowerCase();
    const all = this.getDistinctValues(col);
    if (!term) {
      return all;
    }
    const norm = this.normalizeDigits(term);
    return all.filter(v => this.normalizeDigits(v.toLowerCase()).includes(norm));
  }

  onMenuSearch(key: string, event: Event): void {
    this.menuSearch[key] = (event.target as HTMLInputElement).value;
  }

  isValueSelected(key: string, value: string): boolean {
    const set = this.columnSelections[key];
    return !set || set.has(value);
  }

  toggleValue(col: DataGridColumn, value: string, checked: boolean): void {
    const set = this.columnSelections[col.key] ?? new Set(this.getDistinctValues(col));
    if (checked) {
      set.add(value);
    } else {
      set.delete(value);
    }
    this.commitSelection(col, set);
  }

  isAllSelected(col: DataGridColumn): boolean {
    const set = this.columnSelections[col.key];
    return !set || set.size === this.getDistinctValues(col).length;
  }

  isIndeterminate(col: DataGridColumn): boolean {
    const set = this.columnSelections[col.key];
    return !!set && set.size > 0 && set.size < this.getDistinctValues(col).length;
  }

  toggleSelectAll(col: DataGridColumn, checked: boolean): void {
    this.commitSelection(col, checked ? new Set(this.getDistinctValues(col)) : new Set<string>());
  }

  clearColumnFilter(key: string): void {
    delete this.columnSelections[key];
    this.applyFilter();
  }

  isColumnFiltered(key: string): boolean {
    const set = this.columnSelections[key];
    const col = this.columns.find(c => c.key === key);
    if (!set || !col) {
      return false;
    }
    return set.size < this.getDistinctValues(col).length;
  }

  private commitSelection(col: DataGridColumn, set: Set<string>): void {
    if (set.size === this.getDistinctValues(col).length) {
      delete this.columnSelections[col.key]; // fully selected == no filter
    } else {
      this.columnSelections[col.key] = set;
    }
    this.applyFilter();
  }

  private gridSortAccessor = (row: any, columnId: string): string | number => {
    const col = this.columns.find(c => c.key === columnId);
    if (!col) {
      return row[columnId];
    }
    if (col.type === 'status') {
      return row[col.key] ? 1 : 0;
    }
    const value = row[col.key];
    return typeof value === 'number' ? value : this.getCellText(col, row).toLowerCase();
  };

  private cellHaystack(col: DataGridColumn, row: any): string {
    const text = this.getCellText(col, row);
    return [text, this.normalizeDigits(text)].join(' ').toLowerCase();
  }

  private normalizeDigits(text: string): string {
    return gujaratiToEnglishDigits(text ?? '');
  }

  // ---------- cell helpers (used by the template) ----------

  getCellText(col: DataGridColumn, row: any): string {
    if (col.type === 'status') {
      return this.getStatusLabel(col, row);
    }
    let value = col.format ? col.format(row[col.key], row) : row[col.key];
    if (value == null) {
      return '';
    }
    if (col.gujaratiDigits) {
      value = englishToGujaratiDigits(value);
    }
    return String(value);
  }

  getStatusLabel(col: DataGridColumn, row: any): string {
    return row[col.key] ? (col.statusTrueLabel ?? '') : (col.statusFalseLabel ?? '');
  }

  isStatusOn(col: DataGridColumn, row: any): boolean {
    return !!row[col.key];
  }

  /** Whether the cell is in the positive (green) state per column config. */
  isStatusPositive(col: DataGridColumn, row: any): boolean {
    return this.isStatusOn(col, row) === !!col.statusTruePositive;
  }

  getSubtitle(col: DataGridColumn, row: any): string {
    return col.subtitleFormat ? col.subtitleFormat(row) : '';
  }

  getInitials(col: DataGridColumn, row: any): string {
    return getNameInitials(this.getCellText(col, row));
  }

  getAvatarClass(row: any): string {
    return getAvatarVariant(row?.padyatriId ?? row?.id ?? row?.batchId ?? 0);
  }

  onRowClick(row: any): void {
    if (this.rowClick) {
      this.rowClick(row);
    }
  }

  /** First avatar column (drives the mobile card title). */
  get avatarColumn(): DataGridColumn | undefined {
    return this.columns.find(c => c.type === 'avatar');
  }

  /** First badge column (shown top-right on the mobile card). */
  get badgeColumn(): DataGridColumn | undefined {
    return this.columns.find(c => c.type === 'badge');
  }

  /** Columns shown as meta lines on the mobile card. */
  get mobileMetaColumns(): DataGridColumn[] {
    return this.columns.filter(
      c => c.type !== 'avatar' && c.type !== 'badge' && !c.hideOnMobile
    );
  }
}
