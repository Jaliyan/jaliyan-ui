import { Component, OnInit, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { IdCardComponent } from '../id-card/id-card.component';
import { MatDialog } from '@angular/material/dialog';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { PrintAllIdCardsDialogComponent } from '../print-all-id-cards-dialog/print-all-id-cards-dialog.component';
import { Router } from '@angular/router';



@Component({
  selector: 'app-padyatri-list',
  templateUrl: './padyatri-list.component.html',
  styleUrls: ['./padyatri-list.component.css'],
  standalone: false
})
export class PadyatriListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['select', 'batchId', 'firstName', 'mobile', 'actions'];
  selectedPadyatris: any[] = [];

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('bulkCardContainer', { static: false }) bulkCardContainer!: ElementRef;

  constructor(
    private padyatriService: PadyatriService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPadyatris();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPadyatris(): void {
    this.padyatriService.getPadyatris().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: () => this.toastService.show('Failed to load data', 'error')
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
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
    this.selectedPadyatris = [...this.dataSource.filteredData];
  } else {
    this.selectedPadyatris = [];
  }
}

isAllSelected(): boolean {
  return this.selectedPadyatris.length === this.dataSource.filteredData.length;
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
  const containerEl = this.bulkCardContainer?.nativeElement;

  if (!containerEl || this.selectedPadyatris.length === 0) return;

  const cardElements = containerEl.querySelectorAll('app-id-card');

  const pdf = new jsPDF('p', 'mm', 'a4');
  let isFirstPage = true;

  for (const cardEl of Array.from(cardElements)) {
    const canvas = await html2canvas(cardEl as HTMLElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null
    });

    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);

    const pdfWidth = 180; // mm
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    if (!isFirstPage) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 15, 15, pdfWidth, pdfHeight);
    isFirstPage = false;
  }

  pdf.save('padyatri-id-cards.pdf');
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


}
