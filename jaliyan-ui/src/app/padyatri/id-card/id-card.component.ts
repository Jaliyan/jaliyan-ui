import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
  Optional
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PadyatriService } from '../../services/padyatri.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-id-card',
  templateUrl: './id-card.component.html',
  styleUrls: ['./id-card.component.css'],
  standalone:false
})
export class IdCardComponent implements OnInit, AfterViewInit {

  photoUrl: string | null = null;

  @ViewChild('qrContainer', { static: false }) qrContainer!: ElementRef;
  @Input() showActions: boolean = true;
  @Input() padyatri: any;  // ✅ ADD THIS

  constructor(
     @Optional() @Inject(MAT_DIALOG_DATA) private injectedData: any,
    private padyatriService: PadyatriService
  ) {}

  get qrData(): string {
  const encoded = btoa(`padyatri:${this.padyatri?.padyatriId}`);
  //return "https://www.google.com/";
  const appBaseUrl = environment.appUrl;
  return `${appBaseUrl}/home?data=${encoded}`;
}

  ngOnInit(): void {
    if (!this.padyatri && this.injectedData) {
      this.padyatri = this.injectedData;
    }

    if (this.padyatri?.photoPath) {
      this.loadPhoto(this.padyatri.photoPath);
    }
  }

  ngAfterViewInit(): void {
  setTimeout(() => {
    const canvas = this.qrContainer?.nativeElement?.querySelector('canvas');
    if (!canvas) {
      console.warn('QR canvas not found after view init');
    }
  }, 300);
}


  loadPhoto(photoPath: string) {
    this.padyatriService.getPadyatriImageAsBlob(photoPath).subscribe({
      next: (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.photoUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },
      error: (err: any) => {
        console.error('Image load failed', err);
        this.photoUrl = null;
      }
    });
  }

  printCard(): void {
    window.print();
  }

  async downloadCard(): Promise<void> {
  const card = document.getElementById('id-card');
  if (!card) return;

  const clone = card.cloneNode(true) as HTMLElement;

  // ⚠️ Get the QR canvas from the live view
  const qrCanvas = this.qrContainer?.nativeElement?.querySelector('canvas');
  if (qrCanvas) {
    const dataUrl = qrCanvas.toDataURL('image/png');

    // Replace the QR section in the cloned card
    const qrSectionClone = clone.querySelector('.qr-section');
    if (qrSectionClone) {
      qrSectionClone.innerHTML = ''; // Clear existing QR code
      const img = new Image();
      img.src = dataUrl;
      img.width = 80;
      img.height = 80;
      qrSectionClone.appendChild(img);
    }
  } else {
    console.warn('QR canvas not found');
  }

  const actions = clone.querySelector('.id-card-actions');
  if (actions) actions.remove();

  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  document.body.removeChild(clone);

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 80; // mm
  const pageHeight = (canvas.height / canvas.width) * imgWidth;

  const pdf = new jsPDF('p', 'mm', [imgWidth, pageHeight]);
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pageHeight);
  pdf.save(`padyatri-${this.padyatri.padyatriId}-id-card.pdf`);
}

}
