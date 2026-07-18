import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AttendanceService } from '../../services/attendance.service';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { Padyatri } from '../../common/padyatri.model';
import { DistributionService } from '../../services/distribution.service';
import { AuthService } from '../../services/auth.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { gujaratiToEnglishDigits } from '../../common/number-utils';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-qr-scan',
  templateUrl: './qr-scan.component.html',
  styleUrls: ['./qr-scan.component.css'],
  standalone: false
})
export class QrScanComponent implements OnInit, AfterViewInit {
  attendanceForm!: FormGroup;
  padyatri: Padyatri[] = [];
  stops: any[] = [];
  itemList: any[] = [];

  dataSource = new MatTableDataSource<Padyatri>();
  displayedColumns: string[] = ['batchId', 'name', 'mobile', 'actions'];

  isMobile = false;
  lastScanTime = 0;
  scanCooldown = 2000;

  cooldownActive = false;
  cooldownMessage = '';
  cooldownBorderColor = '#f57c00';

  userName: any;

  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort!: MatSort;


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

    // Live search
    this.attendanceForm.get('batchSearch')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Fix sorting on new data load
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return `${item.firstName} ${item.lastName}`.toLowerCase();
        default:
          return (item as any)[property];
      }
    };
  }

  ngAfterViewChecked() {
    if (this.dataSource && this.paginator && this.dataSource.paginator !== this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.dataSource && this.sort && this.dataSource.sort !== this.sort) {
      this.dataSource.sort = this.sort;
    }
  }


  buildForm() {
    this.attendanceForm = this.fb.group({
      operationType: ['attendance'],
      selectedStop: [''],
      // selectedItem: [''],
      selectedItem: [[]],
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
        this.dataSource = new MatTableDataSource(data);

        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
      },
      error: () => this.toast.show('Failed to load padyatris', 'error'),
    });
  }

  canScan(): boolean {
    const { operationType } = this.attendanceForm.value;
    console.log(!!this.attendanceForm.value.selectedStop && operationType === 'attendance');

    if (operationType === 'item') {
      return this.attendanceForm.value.selectedItem?.length > 0;

    }
    else {
      return !!this.attendanceForm.value.selectedStop
    }
  }

  applyFilters() {
    let searchValue = this.attendanceForm.get('batchSearch')?.value;
    searchValue = searchValue ? String(searchValue).trim().toLowerCase() : '';

    this.dataSource.filterPredicate = (data: Padyatri, filter: string) => {
      const batchId = String(data.batchId).toLowerCase();
      return (
        batchId.includes(filter)
      );
    };

    this.dataSource.filter = gujaratiToEnglishDigits(searchValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }



  clearBatchSearch() {
    this.attendanceForm.get('batchSearch')?.setValue('');
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

  // markItemGiven(padyatri: Padyatri) {
  //   const { selectedItem } = this.attendanceForm.value;

  //   if (!selectedItem) {
  //     this.toast.show('Please select Item', 'warning');
  //     return;
  //   }

  //   const payload = {
  //     padyatriId: padyatri.padyatriId,
  //     stopId: 0,
  //     itemId: selectedItem,
  //     distributedBy: this.userName,
  //   };

  //   this.distributionService.markItemDistribution(payload).subscribe({
  //     next: () => {
  //       this.toast.show(`Given to ${padyatri.firstName}`, 'success');
  //       this.showCooldownEffect('success', `${selectedItem} marked`);
  //     },
  //     error: () => {
  //       this.showCooldownEffect('error', 'Failed to mark item');
  //     },
  //   });
  // }

  // markItemNotGiven(padyatri: Padyatri) {
  //   const { selectedItem } = this.attendanceForm.value;

  //   if (!selectedItem) {
  //     this.toast.show('Please select Item', 'warning');
  //     return;
  //   }

  //   if (!confirm(`Are you sure you want to revoke this item for ${padyatri.firstName}?`)) {
  //     return;
  //   }

  //   const payload = {
  //     itemId: selectedItem,
  //     padyatriId: padyatri.padyatriId,
  //     revokedBy: this.userName,
  //   };

  //   this.distributionService.revokeItemDistribution(payload).subscribe({
  //     next: () => {
  //       this.toast.show(`Item revoked for ${padyatri.firstName}`, 'success');
  //       this.showCooldownEffect('error', 'Item Revoked');
  //     },
  //     error: () => {
  //       this.toast.show('Failed to revoke item', 'error');
  //       this.showCooldownEffect('error', 'Revoke Failed');
  //     },
  //   });
  // }



  markItemGiven(padyatri: Padyatri) {
    const selectedItems: number[] = this.attendanceForm.value.selectedItem;

    if (!selectedItems || selectedItems.length === 0) {
      this.toast.show('Please select items', 'warning');
      return;
    }

    const requests = selectedItems.map(itemId => {
      const payload = {
        padyatriId: padyatri.padyatriId,
        stopId: 0,
        itemId,
        distributedBy: this.userName
      };
      return this.distributionService.markItemDistribution(payload);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.toast.show(`All selected items given to ${padyatri.firstName}`, 'success');
        this.showCooldownEffect('success', 'All items distributed');
      },
      error: () => {
        this.toast.show('One or more items failed to distribute', 'error');
        this.showCooldownEffect('error', 'Distribution Failed');
      }
    });
  }


  markItemNotGiven(padyatri: Padyatri) {
    const selectedItems: number[] = this.attendanceForm.value.selectedItem;

    if (!selectedItems || selectedItems.length === 0) {
      this.toast.show('Please select items', 'warning');
      return;
    }

    if (!confirm(`Revoke ALL selected items for ${padyatri.firstName}?`)) {
      return;
    }

    const revokeRequests = selectedItems.map(itemId => {
      const payload = {
        itemId,
        padyatriId: padyatri.padyatriId,
        revokedBy: this.userName,
      };
      return this.distributionService.revokeItemDistribution(payload);
    });

    forkJoin(revokeRequests).subscribe({
      next: () => {
        this.toast.show(`Selected items revoked for ${padyatri.firstName}`, 'success');
        this.showCooldownEffect('error', 'Items Revoked');
      },
      error: () => {
        this.toast.show('One or more revocations failed', 'error');
        this.showCooldownEffect('error', 'Revoke Failed');
      }
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
