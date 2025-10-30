import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AttendanceService } from '../../services/attendance.service';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { Padyatri } from '../../common/padyatri.model';
import { DistributionService } from '../../services/distribution.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-qr-scan',
  templateUrl: './qr-scan.component.html',
  styleUrls: ['./qr-scan.component.css'],
  standalone: false,
})
export class QrScanComponent implements OnInit {
  attendanceForm!: FormGroup;
  padyatri: Padyatri[] = [];
  filteredPadyatri: Padyatri[] = [];
  stops: any[] = [];
  itemList: any[] = [];

  dataSource = new MatTableDataSource<Padyatri>();
  displayedColumns: string[] = ['name', 'batchId', 'mobile', 'actions'];

  isMobile = false;
  lastScanTime = 0;
  scanCooldown = 2000;

  cooldownActive = false;
  cooldownMessage = '';
  cooldownBorderColor = '#f57c00';

  userName: any;

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private attendanceService: AttendanceService,
    private toast: ToastService,
    private bpObserver: BreakpointObserver,
    private distributionService: DistributionService,
    private authService: AuthService
  ) {
    this.userName = this.authService.getUsername();
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadStops();
    this.loadPadyatris();

    this.bpObserver.observe([Breakpoints.Handset]).subscribe((result) => {
      this.isMobile = result.matches;
    });

    this.distributionService.getItems().subscribe({
      next: (items) => (this.itemList = items),
      error: (err: any) => console.error(err),
    });
  }

  buildForm() {
    this.attendanceForm = this.fb.group({
      operationType: ['attendance'],
      selectedStop: [''],
      selectedItem: [''],
      attendanceMode: [''],
      batchSearch: [''],
    });
  }

  loadStops() {
    this.attendanceService.getStops().subscribe({
      next: (res) => (this.stops = res),
      error: () => this.toast.show('Failed to load stops', 'error'),
    });
  }

  loadPadyatris() {
    this.padyatriService.getPadyatris().subscribe({
      next: (data) => {
        this.padyatri = data;
        this.filteredPadyatri = data;
        this.dataSource.data = data;
      },
      error: () => this.toast.show('Failed to load padyatris', 'error'),
    });
  }

  canScan(): boolean {
    const { selectedStop } = this.attendanceForm.value;
    return !!selectedStop;
  }

  applyFilters() {
    const batch = this.attendanceForm.get('batchSearch')?.value;
    this.filteredPadyatri = this.padyatri.filter((p) =>
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

  onQrScanned(data: string) {
    const now = Date.now();
    if (now - this.lastScanTime < this.scanCooldown) {
      this.toast.show('Please wait before scanning again', 'info');
      return;
    }
    this.lastScanTime = now;

    if (!this.canScan()) return;

    const padyatriId = this.extractId(data);
    if (!padyatriId) {
      this.showCooldownEffect('error', 'Invalid QR');
      return;
    }

    const found = this.padyatri.find((p) => p.padyatriId === padyatriId);
    if (found) {
      this.handleOperation(found);
    } else {
      this.showCooldownEffect('error', 'Padyatri not found');
      this.toast.show('Padyatri not found for scanned QR', 'warning');
    }
  }

  handleOperation(padyatri: Padyatri) {
    const { operationType } = this.attendanceForm.value;

    if (operationType === 'attendance') {
      this.markAttendance(padyatri, true);
    } else if (operationType === 'item') {
      this.markItemGiven(padyatri);
    }
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
      isPresent,
    };

    this.attendanceService.markAttendance(payload).subscribe({
      next: () => {
        this.toast.show(
          `Marked ${isPresent ? 'Present' : 'Absent'} for ${padyatri.firstName}`,
          'success'
        );
        this.showCooldownEffect('success', 'Marked Present');
      },
      error: () => {
        this.showCooldownEffect('error', 'Failed to mark attendance');
      },
    });
  }

  markItemGiven(padyatri: Padyatri) {
    const { selectedStop, selectedItem } = this.attendanceForm.value;

    if (!selectedStop || !selectedItem) {
      this.toast.show('Please select Stop and Item', 'warning');
      return;
    }

    const payload = {
      padyatriId: padyatri.padyatriId,
      stopId: selectedStop,
      itemId: selectedItem,
      distributedBy: this.userName,
    };

    this.distributionService.markItemDistribution(payload).subscribe({
      next: () => {
        this.toast.show(
          `${selectedItem} given to ${padyatri.firstName}`,
          'success'
        );
        this.showCooldownEffect('success', `${selectedItem} marked`);
      },
      error: () => {
        this.showCooldownEffect('error', 'Failed to mark item');
      },
    });
  }

  extractId(qrData: string): number | null {
    try {
      let encodedData = qrData;
      if (qrData.startsWith('http')) {
        const url = new URL(qrData);
        encodedData = url.searchParams.get('data') || '';
      }

      const decoded = atob(encodedData);
      const match = decoded.match(/^padyatri:(\d+)$/);
      return match ? +match[1] : null;
    } catch (e) {
      console.error('Failed to decode QR', e);
      return null;
    }
  }

  showCooldownEffect(type: 'success' | 'error', message: string) {
    this.cooldownActive = true;
    this.cooldownMessage = message;
    this.cooldownBorderColor = type === 'success' ? '#4caf50' : '#f44336';

    setTimeout(() => {
      this.cooldownActive = false;
      this.cooldownMessage = '';
    }, 2000);
  }
}
