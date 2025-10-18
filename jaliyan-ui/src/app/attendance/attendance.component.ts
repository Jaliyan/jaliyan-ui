import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AttendanceService } from '../services/attendance.service';
import { PadyatriService } from '../services/padyatri.service';
import { ToastService } from '../services/toast.service';
import { Padyatri } from '../common/padyatri.model';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css'],
  standalone: false
})
export class AttendanceComponent implements OnInit {
  filterForm!: FormGroup;
  stops: any[] = [];
  padyatri: Padyatri[] = [];
  filteredPadyatri: Padyatri[] = [];
  displayedColumns: string[] = ['name', 'batchId', 'contact', 'attendance'];
  dataSource = new MatTableDataSource<Padyatri>([]);
  isMobile = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStops();
    this.loadPadyatris();

    // Detect screen size
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  initForm() {
    this.filterForm = this.fb.group({
      selectedStop: [0],
      batchSearch: ['']
    });
  }

  loadStops() {
    this.padyatriService.getStops().subscribe(
      (stops) => (this.stops = stops),
      () => this.toastService.show('Failed to load stops.', 'error')
    );
  }

  loadPadyatris() {
    this.padyatriService.getPadyatris().subscribe(
      (data) => {
        this.padyatri = data;
        this.filteredPadyatri = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      () => this.toastService.show('Failed to load padyatri data.', 'error')
    );
  }

  applyFilters(): void {
    const stopId = this.filterForm.get('selectedStop')?.value;
    const batchSearch = this.filterForm.get('batchSearch')?.value;

    if (stopId === 0) {
      this.toastService.show('Please select a stop first.', 'warning');
      return;
    }

    this.filteredPadyatri = this.padyatri.filter((user) => {
      const matchesStop = stopId ? true : false;
      const matchesBatch = batchSearch ? user.batchId === +batchSearch : true;
      return matchesStop && matchesBatch;
    });

    this.dataSource.data = this.filteredPadyatri;
  }

  clearBatchSearch(): void {
    this.filterForm.get('batchSearch')?.setValue('');
    this.applyFilters();
  }

  markAttendance(user: Padyatri, status: 'Present' | 'Absent'): void {
    const stopId = this.filterForm.get('selectedStop')?.value;

    if (stopId === 0) {
      this.toastService.show('Please select a stop before marking attendance.', 'warning');
      return;
    }

    const isPresent = status === 'Present';

    this.attendanceService.markAttendance(user.padyatriId, isPresent, stopId).subscribe(
      () => this.toastService.show(`Marked ${status} for ${user.firstName}`, 'success'),
      (error) => this.toastService.show(`Failed to mark attendance. ${error.message}`, 'error')
    );
  }

  goToUserDetail(user: Padyatri): void {
    this.router.navigate(['/user-detail', user.padyatriId]);
  }
}
