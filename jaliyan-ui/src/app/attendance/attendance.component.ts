import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService } from '../services/attendance.service';
import { PadyatriService } from '../services/padyatri.service';
import { Padyatri } from '../common/padyatri.model';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-attendance',
  standalone: false,
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css'
})
export class AttendanceComponent {
  stops: any[] = [];
  padyatri: Padyatri[] = [];
  filteredPadyatri: Padyatri[] = [];
  batchSearch: number = 0 ;
  selectedStop: number = 0;
  toasts: any[] = [];

  constructor(private padyatriService: PadyatriService,  // Using PadyatriService
    private attendanceService: AttendanceService,  // Using AttendanceService
    private router: Router,
    private toastService: ToastService) {}

  ngOnInit(): void {
    // Load stops and user data on component load
    this.loadStops();
    this.loadPadyatri();
  }

  loadStops() {
    this.padyatriService.getStops().subscribe((stops: any[]) => {
      this.stops = stops;
    });
  }

  loadPadyatri() {
    this.padyatriService.getPadyatris().subscribe((padyatri: Padyatri[]) => {
      this.padyatri = padyatri;
      this.filteredPadyatri = padyatri;
    });
  }

  onBatchSearch() {
    if (this.selectedStop === 0) {
      this.toastService.showToast('Please select a stop first to search users.', 'Error', 'danger');
      return; // Prevent further search if stop is not selected
    }
    // If batchSearch is a number, filter by batchNumber; otherwise, filter by batchId (string)
    if (this.batchSearch > 0) {
      if (typeof this.batchSearch === 'number') {
        this.filteredPadyatri = this.padyatri.filter(user => user.batchId === this.batchSearch);
      }
    } else {
      this.filteredPadyatri = this.padyatri;  // Reset the filtered list if no search input
    }
  }

  
  markAttendance(padyatri: Padyatri, status: string) {
    
    if (this.selectedStop === 0) {
      this.toastService.showToast('Please select a stop first to mark attendance.', 'Error', 'danger');
      return; // Prevent marking attendance if stop is not selected
    }

    this.attendanceService.markAttendance(padyatri.padyatraId, status.toLowerCase() == "present",this.selectedStop ).subscribe(
      () => {
        // Show individual toast for each update
        this.toastService.showToast(`Marked ${status} for ${padyatri.firstName}`, 'Success', 'success');
      },
      (error: { message: any; }) => {
        // Handle error and show toast
        this.toastService.showToast(`Error: ${error.message}`, 'Error', 'danger');
      }
    );
  }
}