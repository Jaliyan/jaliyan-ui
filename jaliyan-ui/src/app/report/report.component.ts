import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { AttendanceService } from '../services/attendance.service';

export interface PadyatriReport {
  padyatriId: number;
  fullName: string;
  batchId: number;
  isPresent: boolean;
  attendanceTime: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: false
})
export class ReportComponent implements OnInit, AfterViewInit {
  locations: any[] = [];
  selectedStopId: number | null = null;
  displayedColumns: string[] = ['batchId', 'fullName', 'attendanceTime', 'isPresent'];
  dataSource = new MatTableDataSource<PadyatriReport>();
  loading = false;

  // Summary
  totalCount = 0;
  presentCount = 0;
  absentCount = 0;

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;

  constructor(private attendanceService: AttendanceService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Load stops for the dropdown
    this.attendanceService.getStops().subscribe({
      next: (locs) => (this.locations = locs),
      error: (err) => console.error('Error loading locations:', err)
    });
  }

  ngAfterViewInit() {
    // Link paginator and sort to the dataSource
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom filter to search by multiple fields
    this.dataSource.filterPredicate = (data: PadyatriReport, filter: string) => {
      const normalizedFilter = filter.trim().toLowerCase();
      return (
        data.fullName.toLowerCase().includes(normalizedFilter) ||
        data.batchId.toString().includes(normalizedFilter)
      );
    };
  }

loadReport() {
  if (!this.selectedStopId) return;
  this.loading = true;
  this.resetSummary();

  this.attendanceService.getAttendanceDetailsByStop(this.selectedStopId).subscribe({
    next: (data: PadyatriReport[]) => {
      // Set data
      this.dataSource.data = data;

      // Update summary
      this.totalCount = data.length;
      this.presentCount = data.filter((x: PadyatriReport) => x.isPresent).length;
      this.absentCount = this.totalCount - this.presentCount;

      // Force paginator to recalc
      setTimeout(() => {
        if (this.paginator) {
          this.paginator.length = data.length;
          this.paginator.pageIndex = 0; // reset to first page
          this.cdr.detectChanges();    // ensure UI updates
        }
      });

      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading report:', err);
      this.loading = false;
    }
  });
}
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;

    // Reset to first page after filter
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private resetSummary() {
    this.totalCount = 0;
    this.presentCount = 0;
    this.absentCount = 0;
  }
}
