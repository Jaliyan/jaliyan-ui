import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AttendanceService } from '../services/attendance.service';
import { PadyatriAttendance, PadyatriItem } from '../common/padyatri.model';
import { DistributionService } from '../services/distribution.service';


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: false
})
export class ReportComponent implements OnInit, AfterViewInit {

  // Tabs
  activeTab: 'attendance' | 'item' = 'attendance';

  // Attendance
  locations: any[] = [];
  selectedStopId: number | null = null;
  attendanceColumns: string[] = ['batchId', 'fullName', 'attendanceTime', 'isPresent'];
  attendanceData = new MatTableDataSource<PadyatriAttendance>();
  totalCount = 0;
  presentCount = 0;
  absentCount = 0;

  // Item Distribution
  itemColumns: string[] = ['batchId', 'fullName'];
  itemList: any[] = [];
  itemData = new MatTableDataSource<PadyatriItem>();

  loading = false;

  selectedIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private attendanceService: AttendanceService, private cdr: ChangeDetectorRef, 
    private distributionService : DistributionService) { }

  ngOnInit() {
    // Load stops
    this.attendanceService.getStops().subscribe({
      next: (stops) => this.locations = stops,
      error: (err) => console.error(err)
    });

    // Load item list
    this.distributionService.getItems().subscribe({
      next: (items) => {
        // this.itemList = items;
        this.itemList = items.map((x: any) => x.itemName);
        this.itemColumns = ['batchId', 'fullName', ...this.itemList];
      },
      error: (err: any) => console.error(err)
    });
  }

  ngAfterViewInit() {
    this.attendanceData.paginator = this.paginator;
    this.attendanceData.sort = this.sort;

    this.itemData.paginator = this.paginator;
    this.itemData.sort = this.sort;

    // Filter for multiple fields
    this.attendanceData.filterPredicate = (data: PadyatriAttendance, filter: string) => {
      const f = filter.trim().toLowerCase();
      return data.fullName.toLowerCase().includes(f) || data.batchId.toString().includes(f);
    };

    this.itemData.filterPredicate = (data: PadyatriItem, filter: string) => {
      const f = filter.trim().toLowerCase();
      return data.fullName.toLowerCase().includes(f) || data.batchId.toString().includes(f);
    };
  }

  // Switch Tabs
  // switchTab(tab: 'attendance' | 'items') {
  //   this.activeTab = tab;
  //   this.resetSummary();
  // }


 get currentDataSource(): any {
  return this.activeTab === 'attendance' ? this.attendanceData : this.itemData;
}
trackByIndex(index: number, _: any) {
  return index;
}
  onTabChange(index: number) {
  this.activeTab = index === 0 ? 'attendance' : 'item';
}

  // Attendance Report
  loadAttendanceReport() {
    if (!this.selectedStopId) return;
    this.loading = true;
    this.resetSummary();

    this.attendanceService.getAttendanceDetailsByStop(this.selectedStopId).subscribe({
      next: (data: PadyatriAttendance[]) => {
        this.attendanceData.data = data;
        this.totalCount = data.length;
        this.presentCount = data.filter(x => x.isPresent).length;
        this.absentCount = this.totalCount - this.presentCount;
        this.loading = false;
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  // Item Report
  loadItemReport() {
    this.loading = true;
    this.distributionService.getItemDistribution().subscribe({
      next: (rawData: any[]) => {
        const map = new Map<number, PadyatriItem>();
        rawData.forEach(r => {
          if (!map.has(r.padyatriId)) {
            map.set(r.padyatriId, {
              padyatriId: r.padyatriId,
              fullName: r.fullName,
              batchId: r.batchId,
              items: {}
            });
          }
          map.get(r.padyatriId)!.items[r.itemName] = r.isGiven;
        });
        this.itemData.data = Array.from(map.values());
        this.loading = false;
      },
      error: (err: any) => { console.error(err); this.loading = false; }
    });
  }

  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.activeTab === 'attendance') this.attendanceData.filter = value;
    else this.itemData.filter = value;
  }

  private resetSummary() {
    this.totalCount = 0;
    this.presentCount = 0;
    this.absentCount = 0;
  }
}
