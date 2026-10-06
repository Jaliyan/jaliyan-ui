import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { IdCardComponent } from '../id-card/id-card.component';
import { MatDialog } from '@angular/material/dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { PrintAllIdCardsDialogComponent } from '../print-all-id-cards-dialog/print-all-id-cards-dialog.component';
import { Router } from '@angular/router';
import { PadyatriViewDialogComponent } from '../padyatri-view-dialog/padyatri-view-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { englishToGujaratiDigits } from '../../common/number-utils';
import { padyatriSearchPredicate } from '../../common/padyatri-search';
import { DataGridColumn, DataGridQuickFilter } from '../../shared/data-grid/data-grid.types';



@Component({
  selector: 'app-padyatri-list',
  templateUrl: './padyatri-list.component.html',
  styleUrls: ['./padyatri-list.component.css'],
  standalone: false
})
export class PadyatriListComponent implements OnInit {
  /** Rows shown in the grid. */
  padyatris: any[] = [];

  /** Grid column configuration. */
  columns: DataGridColumn[] = [];

  /** Quick status filter chips (the grid prepends an "All" chip). */
  quickFilters: DataGridQuickFilter[] = [
    { key: 'active', label: 'Active', translate: true, predicate: (r) => !r.isReturn },
    { key: 'returned', label: 'Returned', translate: true, predicate: (r) => r.isReturn }
  ];

  /** Shared name/batch/mobile search reused by the grid. */
  searchPredicate = padyatriSearchPredicate;

  selectedPadyatris: any[] = [];
  userName: any;

  @ViewChild('bulkCardContainer', { static: false }) bulkCardContainer!: ElementRef;

  constructor(
    private padyatriService: PadyatriService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.userName = this.authService.getUsername();
  }

  ngOnInit(): void {
    this.buildColumns();
    this.loadPadyatris();
  }

  private buildColumns(): void {
    this.columns = [
      {
        key: 'name', header: 'Padyatri', type: 'avatar',
        translateHeader: true, sortable: true, filterable: true,
        format: (_v, row) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
        subtitleFormat: (row) => this.buildSubtitle(row)
      },
      {
        key: 'batchId', header: 'BatchID', type: 'badge',
        translateHeader: true, sortable: true, filterable: true,
        gujaratiDigits: true
      },
      {
        key: 'mobile', header: 'Mobile', type: 'text',
        translateHeader: true, sortable: true, filterable: true, icon: 'call'
      },
      {
        key: 'isReturn', header: 'Status', type: 'status',
        translateHeader: true, sortable: true,
        statusTrueLabel: 'Returned', statusFalseLabel: 'Active', translateStatus: true
      }
    ];
  }

  private buildSubtitle(row: any): string {
    const age = row?.age != null ? `${this.translate.instant('Age')} ${englishToGujaratiDigits(row.age)}` : '';
    const gender = row?.gender ? ` · ${row.gender}` : '';
    return `${age}${gender}`.trim();
  }

  /** Opens the detail dialog when a mobile card is tapped. */
  openMobile = (row: any): void => {
    this.openMobileActions(row);
  };

  /** Total registered padyatris. */
  get totalCount(): number {
    return this.padyatris.length;
  }

  viewPadyatri(padyatri: any) {
    const isMobile = this.breakpointObserver.isMatched([Breakpoints.Handset, Breakpoints.Small]);
    this.dialog.open(PadyatriViewDialogComponent, {
      width: isMobile ? '100%' : '500px',  // Use % instead of vw for better theme alignment
      maxWidth: '95vw',
      height: 'auto',
      maxHeight: '90vh',  // restrict height to prevent overflow
      data: padyatri,
      panelClass: 'padyatri-dialog'
    });

  }

  openMobileActions(padyatri: any) {
    this.dialog.open(PadyatriViewDialogComponent, {
      width: '100vw',
      height: 'auto',
      maxHeight: '95vh',
      data: padyatri,
      panelClass: 'mobile-card-dialog'
    });
  }


  loadPadyatris(): void {
    this.padyatriService.getPadyatris().subscribe({
      next: (data) => {
        this.padyatris = data;
      },
      error: () => this.toastService.show('Failed to load data', 'error')
    });
  }

  toGujaratiDigits(value: string | number): string {
    return englishToGujaratiDigits(value);
  }

  addNewPadyatri(): void {
    this.router.navigate(['/padyatri/add']);
  }

  editPadyatri(padyatri: any): void {
    this.router.navigate(['/padyatri/edit', padyatri.padyatriId]);
  }

  deletePadyatri(padyatriId: number): void {
    if (confirm('Are you sure you want to delete this Padyatri?')) {
      this.padyatriService.deletePadyatri(padyatriId, "admin").subscribe({
        next: () => {
          this.toastService.show('Deleted successfully', 'success');
          this.loadPadyatris();
        },
        error: () => this.toastService.show('Delete failed', 'error')
      });
    }
  }

  viewIDCard(padyatri: any): void {
    this.dialog.open(IdCardComponent, {
      width: '350px',
      data: padyatri,
      panelClass: 'id-card-dialog'
    });
  }

  generateQRCode(padyatri: any): void {
    // Implement QR code generation
  }

  toggleRow(row: any): void {
    const index = this.selectedPadyatris.indexOf(row);
    if (index === -1) {
      this.selectedPadyatris.push(row);
    } else {
      this.selectedPadyatris.splice(index, 1);
    }
  }

  toggleAllRows(event: any): void {
    if (event.checked) {
      this.selectedPadyatris = [...this.padyatris];
    } else {
      this.selectedPadyatris = [];
    }
  }

  isAllSelected(): boolean {
    return this.selectedPadyatris.length === this.padyatris.length;
  }

  isSomeSelected(): boolean {
    return this.selectedPadyatris.length > 0 && !this.isAllSelected();
  }

  printSelectedIDCards(): void {
    this.router.navigate(['/padyatri/print-id-cards'], {
      state: { data: this.selectedPadyatris }
    });
  }


  async downloadBulkIDCards(): Promise<void> {
    if (!this.selectedPadyatris.length) {
      alert('Please select at least one Padyatri');
      return;
    }

    // Wait for Angular to render cards
    this.cdr.detectChanges();
    await new Promise((r) => setTimeout(r, 400));

    const containerEl = this.bulkCardContainer?.nativeElement;
    if (!containerEl) {
      console.error('Bulk card container not found');
      return;
    }

    // Wait for images in ID cards to load
    await this.waitForImagesToLoad(containerEl);

    const cardElements = containerEl.querySelectorAll('app-id-card');
    if (!cardElements.length) {
      console.error('No ID cards found in container');
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    let isFirstPage = true;

    for (const cardEl of Array.from(cardElements)) {
      const canvas = await html2canvas(cardEl as HTMLElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData.startsWith('data:image/')) continue;

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = 180;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 15, 15, pdfWidth, pdfHeight);
      isFirstPage = false;
    }

    pdf.save('padyatri-id-cards.pdf');
  }

  /** Utility to wait for all images */
  private async waitForImagesToLoad(container: HTMLElement): Promise<void> {
    const imgs = container.querySelectorAll('img');
    const promises = Array.from(imgs).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    );
    await Promise.all(promises);
  }



  async getPhotoDataURL(photoPath: string): Promise<string> {
    return new Promise((resolve) => {
      this.padyatriService.getPadyatriImageAsBlob(photoPath).subscribe(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, () => resolve('../../assets/images/Logo1.jpg'));
    });
  }



  async renderQRCode(data: string, elementId: string): Promise<void> {
    const container = document.getElementById(elementId);
    if (container) {
      container.innerHTML = ''; // Clear old
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, data, { width: 80 });
      container.appendChild(canvas);
    }
  }

  returnPadyatri(padyatriId: number, isreturn: boolean): void {

    var returnMsg = isreturn ? "mark return for" : "active"
    if (confirm('Are you sure you want to ' + returnMsg + ' this Padyatri?')) {
      const payload = {
        padyatriId: padyatriId,
        updatedBy: "admin",
        isreturn: isreturn,
      };
      this.padyatriService.returnPadyatri(payload).subscribe({
        next: () => {
          this.toastService.show('Marked successfully', 'success');
          this.loadPadyatris();
        },
        error: () => this.toastService.show('Return failed', 'error')
      });
    }
  }

}
