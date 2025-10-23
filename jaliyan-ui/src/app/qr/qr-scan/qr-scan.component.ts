import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AttendanceService } from '../../services/attendance.service';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { Padyatri } from '../../common/padyatri.model';

@Component({
  selector: 'app-qr-scan',
  templateUrl: './qr-scan.component.html',
  styleUrls: ['./qr-scan.component.css'],
  standalone: false
})
export class QrScanComponent implements OnInit {
  attendanceForm!: FormGroup;
  stops: any[] = [];
  padyatri: Padyatri[] = [];
  filteredPadyatri: Padyatri[] = [];
  dataSource = new MatTableDataSource<Padyatri>();
  isMobile = false;
  qrSuccess = false;
  qrError = false;
  lastScanTime = 0;
  scanCooldown = 2000; // 2 seconds
  cooldownActive = false;
  cooldownMessage = '';
  cooldownBorderColor = '#f57c00'; // Default orange border


  displayedColumns: string[] = ['name', 'batchId', 'mobile', 'actions'];

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private attendanceService: AttendanceService,
    private toast: ToastService,
    private bpObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.loadStops();
    this.loadPadyatris();

    this.bpObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  buildForm() {
    this.attendanceForm = this.fb.group({
      selectedStop: [''],
      attendanceMode: [''],
      batchSearch: ['']
    });
  }

  loadStops() {
    this.padyatriService.getStops().subscribe({
      next: res => (this.stops = res),
      error: () => this.toast.show('Failed to load stops', 'error')
    });
  }

  loadPadyatris() {
    this.padyatriService.getPadyatris().subscribe({
      next: data => {
        this.padyatri = data;
        this.filteredPadyatri = data;
        this.dataSource.data = data;
      },
      error: () => this.toast.show('Failed to load padyatris', 'error')
    });
  }

  canScan(): boolean {
    const { selectedStop } = this.attendanceForm.value;
    return !!selectedStop;
  }

  applyFilters() {
    const batch = this.attendanceForm.get('batchSearch')?.value;

    this.filteredPadyatri = this.padyatri.filter(p =>
      batch ? p.batchId === +batch : true
    );

    this.dataSource.data = this.filteredPadyatri;
  }

  clearBatchSearch() {
    this.attendanceForm.get('batchSearch')?.setValue('');
    this.applyFilters();
  }

  setMode(mode: 'manual' | 'qr') {
    if (!this.canScan()) return;
    this.attendanceForm.get('attendanceMode')?.setValue(mode);
  }

  markAttendance(padyatri: Padyatri, isPresent: boolean) {
    const { selectedStop } = this.attendanceForm.value;

    if (!selectedStop) {
      this.toast.show('Please select Stop', 'warning');
      return;
    }

    const payload = {
      padyatriId: padyatri.padyatriId,
      stopId: selectedStop,
      isPresent
    };

    this.attendanceService.markAttendance(payload).subscribe({
      next: () => {
        this.toast.show(`Marked ${isPresent ? 'Present' : 'Absent'} for ${padyatri.firstName}`, 'success');
        this.cooldownMessage = 'Marked Present';
        this.showCooldownEffect('success');
      },
      error: () => {
        this.toast.show('Failed to mark attendance', 'error');
        this.cooldownMessage = 'Failed to mark attendance';
        this.showCooldownEffect('error');
      }
    });
  }

  onQrScanned(data: string) {
    const now = Date.now();

    if (now - this.lastScanTime < this.scanCooldown) {
      this.cooldownMessage = 'Please wait before scanning again';
      this.showCooldownEffect();
      this.toast.show('Please wait before scanning again', 'info');
      return;
    }

    this.lastScanTime = now;

    if (!this.canScan()) return;

    const padyatriId = this.extractId(data);
    if (!padyatriId) {
      this.cooldownMessage = 'Invalid QR code';
      this.showCooldownEffect('error');
      return;
    }

    const found = this.padyatri.find(p => p.padyatriId === padyatriId);
    if (found) {
      this.markAttendance(found, true);
    } else {
      this.cooldownMessage = 'Padyatri not found';
      this.showCooldownEffect('error');
      this.toast.show('Padyatri not found for scanned QR', 'warning');
    }
  }

  showCooldownEffect(type: 'success' | 'error' = 'error') {
    this.cooldownActive = true;
    this.cooldownBorderColor = type === 'success' ? '#4caf50' : '#f44336'; // green or red

    setTimeout(() => {
      this.cooldownActive = false;
      this.cooldownMessage = '';
      this.cooldownBorderColor = '';
    }, 2000);
  }


  showQrSuccess() {
    this.qrSuccess = true;
    this.qrError = false;

    setTimeout(() => {
      this.qrSuccess = false;
    }, 3000);
  }

  showQrError() {
    this.qrError = true;
    this.qrSuccess = false;

    setTimeout(() => {
      this.qrError = false;
    }, 3000);
  }


  extractId(qrData: string): number | null {
  try {
    let encodedData = qrData;
    if (qrData.startsWith('http')) {
      const url = new URL(qrData);
      encodedData = url.searchParams.get('data') || '';
      if (!encodedData) throw new Error('Missing data parameter');
    }

    const decoded = atob(encodedData);
    const match = decoded.match(/^padyatri:(\d+)$/);
    return match ? +match[1] : null;
  } catch (e) {
    console.error('Failed to decode QR', e);
    this.showCooldownEffect('error');
    this.toast.show(`Failed to decode QR ${e}`, 'warning');
    return null;
  }
}

}
