import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AttendanceService } from '../services/attendance.service';
import { DistributionService } from '../services/distribution.service';
import { PadyatriAttendance, PadyatriItem } from '../common/padyatri.model';
import { gujaratiToEnglishDigits } from '../common/number-utils';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: false
})
export class ReportComponent implements OnInit, AfterViewInit {

  isMobile = false;

  activeTab: 'attendance' | 'item' = 'attendance';
  selectedIndex = 0;

  locations: any[] = [];
  selectedStopId: number | null = null;

  attendanceColumns: string[] = ['batchId', 'fullName', 'attendanceTime', 'isPresent'];
  attendanceData = new MatTableDataSource<PadyatriAttendance>();

  itemColumns: string[] = ['batchId', 'fullName'];
  itemList: string[] = [];
  itemData = new MatTableDataSource<PadyatriItem>();

  loading = false;

  totalCount = 0;
  presentCount = 0;
  absentCount = 0;
  returnCount = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private attendanceService: AttendanceService,
    private distributionService: DistributionService,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit() {
    // Detect only MOBILE for card layout
    this.breakpointObserver.observe([Breakpoints.HandsetPortrait])
      .subscribe(result => this.isMobile = result.matches);

    // Load stops list
    this.attendanceService.getStops().subscribe(res => this.locations = res);

    // Load item headers
    this.distributionService.getItems().subscribe(items => {
      this.itemList = items.map(x => x.itemName);
      this.itemColumns = ['batchId', 'fullName', ...this.itemList];
    });
  }

  ngAfterViewInit() {
    // Attach paginator/sort initially
    this.attachTableControls();
  }

  // Re-attaches paginator & sort based on active tab
  private attachTableControls() {
    const ds = this.currentDataSource;
    if (!ds) return;

    ds.paginator = this.paginator;
    ds.sort = this.sort;

    this.cdr.detectChanges();
  }

  // Unified data source for HTML
  get currentDataSource(): MatTableDataSource<any> {
    return this.activeTab === 'attendance'
      ? this.attendanceData
      : this.itemData;
  }

  onTabChange(index: number) {
    this.activeTab = index === 0 ? 'attendance' : 'item';

    setTimeout(() => this.attachTableControls(), 10);
  }

  switchTab(tab: 'attendance' | 'item') {
  this.activeTab = tab;

  // Reset search & table when switching
  if (this.currentDataSource?.paginator) {
    this.currentDataSource.paginator.firstPage();
  }
}


  loadAttendanceReport() {
    if (!this.selectedStopId) return;
    this.loading = true;

    this.attendanceService.getAttendanceDetailsByStop(this.selectedStopId).subscribe({
      next: data => {
        this.attendanceData = new MatTableDataSource(data);

        this.totalCount = data.length;
        this.presentCount = data.filter((x: { isPresent: any; }) => x.isPresent).length;
        this.returnCount = data.filter((x: { isReturn: any; }) => x.isReturn).length;
        this.absentCount = this.totalCount - this.presentCount - this.returnCount;
        

        this.loading = false;

        setTimeout(() => this.attachTableControls(), 10);
      },
      error: () => this.loading = false
    });
  }

  loadItemReport() {
    this.loading = true;

    this.distributionService.getItemDistribution().subscribe({
      next: raw => {

        const map = new Map<number, PadyatriItem>();

        raw.forEach((row: { padyatriId: number; fullName: any; batchId: any; itemName: string | number; isGiven: boolean; }) => {
          if (!map.has(row.padyatriId)) {
            map.set(row.padyatriId, {
              padyatriId: row.padyatriId,
              fullName: row.fullName,
              batchId: row.batchId,
              items: {}
            });
          }
          map.get(row.padyatriId)!.items[row.itemName] = row.isGiven;
        });

        this.itemData = new MatTableDataSource([...map.values()]);

        this.loading = false;

        setTimeout(() => this.attachTableControls(), 10);
      },
      error: () => this.loading = false
    });
  }

  trackByIndex(index: number) {
    return index;
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();

    const ds = this.currentDataSource;

    ds.filterPredicate = (data: any, filter: string) => {
        const batchId = String(data.batchId).toLowerCase();
        return (
          batchId.includes(filter)
        );
      };

    ds.filter = gujaratiToEnglishDigits(value);

    if (ds.paginator) ds.paginator.firstPage();
  }
}
