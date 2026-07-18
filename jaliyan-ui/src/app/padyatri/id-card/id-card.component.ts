import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
  Optional,
  ViewEncapsulation
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PadyatriService } from '../../services/padyatri.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { environment } from '../../environments/environment';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-id-card',
  templateUrl: './id-card.component.html',
  styleUrls: ['./id-card.component.css'],
  standalone: false,
encapsulation:ViewEncapsulation.Emulated

})
export class IdCardComponent implements OnInit, AfterViewInit {

  photoUrl: string | null = null;
  isFlipped = false;
  currentYear = new Date().getFullYear();

  @ViewChild('qrContainer', { static: false }) qrContainer!: ElementRef;
  @ViewChild('frontCard', { static: false }) frontCard!: ElementRef;
  @ViewChild('backCard', { static: false }) backCard!: ElementRef;

  @Input() showActions: boolean = true;
  @Input() padyatri: any;

  qrImage: string = '';

  private readonly CARD_PX_WIDTH = 280;
  private readonly CARD_PX_HEIGHT = 448;

  private readonly CARD_MM_WIDTH = 60;
  private readonly CARD_MM_HEIGHT = 96;

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) private injectedData: any,
    private padyatriService: PadyatriService
  ) { }

  get qrData(): string {
    const encoded = btoa(`padyatri:${this.padyatri?.padyatriId}`);
    //return "https://www.google.com/";
    const appBaseUrl = environment.appUrl;
    return `${appBaseUrl}/home?data=${encoded}`;
  }

  async generateQR() {
  try {
    const qrCanvas = await QRCode.toCanvas(this.qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 12,
      color: { dark: '#000000', light: '#FFFFFF' }
    });


    const logo = new Image();
    logo.src = 'assets/images/Logo_old.jpg';     // your logo
    await new Promise(res => (logo.onload = res));


    const size = qrCanvas.width;
    const logoSize = size * 0.25; // 25% of QR size
    const position = (size - logoSize) / 2;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = size;
    finalCanvas.height = size;

    const ctx = finalCanvas.getContext('2d')!;
    ctx.drawImage(qrCanvas, 0, 0, size, size);

    // Draw logo on top
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(position - 8, position - 8, logoSize + 16, logoSize + 16, 10);
    ctx.fill();

    ctx.drawImage(logo, position, position, logoSize, logoSize);

  
    this.qrImage = finalCanvas.toDataURL('image/png');

  } catch (err) {
    console.error("QR generation with logo failed", err);
  }
}



  ngOnInit(): void {
    if (!this.padyatri && this.injectedData) {
      this.padyatri = this.injectedData;
    }

    this.generateQR();

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

  flipCard(): void {
    this.isFlipped = !this.isFlipped;
  }

  private resolveAssetUrl(relativePath: string): string {
    // If it's already absolute, return it
    if (/^https?:\/\//i.test(relativePath)) return relativePath;

    // Build an absolute URL from current origin
    return `${window.location.origin}/${relativePath.replace(/^\/+/, '')}`;
  }


 
  private prepareCloneForCapture(source: HTMLElement): HTMLElement {
    const clone = source.cloneNode(true) as HTMLElement;

    clone.style.transform = 'none';
    (clone.style as any).webkitTransform = 'none';
    clone.style.position = 'relative';
    clone.style.margin = '0';
    clone.style.width = `${this.CARD_PX_WIDTH}px`;
    clone.style.height = `${this.CARD_PX_HEIGHT}px`;
    (clone.style as any).backfaceVisibility = 'visible';
    clone.style.fontFamily = "'Noto Sans Gujarati', sans-serif";

    const photoEl = clone.querySelector('.photo') as HTMLImageElement | null;
    if (photoEl && this.photoUrl) photoEl.src = this.photoUrl;

    const logoEl = clone.querySelector('.logo') as HTMLImageElement | null;
    if (logoEl) logoEl.src = this.resolveAssetUrl(logoEl.getAttribute('src') || '');

    const qrImg = clone.querySelector('.qr-img') as HTMLImageElement | null;
    if (qrImg && this.qrImage) qrImg.src = this.qrImage;

    return clone;
  }

  /** Rasterise one card side to a canvas at a fixed, deterministic resolution. */
  private async renderSide(source: HTMLElement): Promise<HTMLCanvasElement> {
    const clone = this.prepareCloneForCapture(source);

    const holder = document.createElement('div');
    holder.style.position = 'fixed';
    holder.style.top = '0';
    holder.style.left = '-10000px';
    holder.style.width = `${this.CARD_PX_WIDTH}px`;
    holder.style.height = `${this.CARD_PX_HEIGHT}px`;
    holder.style.background = '#ffffff';
    holder.appendChild(clone);
    document.body.appendChild(holder);

   try {
      const fonts = (document as any).fonts;
      if (fonts?.load) {
        await Promise.all([
          fonts.load("400 16px 'Noto Sans Gujarati'"),
          fonts.load("500 16px 'Noto Sans Gujarati'"),
          fonts.load("600 16px 'Noto Sans Gujarati'"),
          fonts.load("700 16px 'Noto Sans Gujarati'")
        ]);
      }
      await fonts?.ready;
    } catch { /* older browsers */ }

    const canvas = await html2canvas(clone, {
      scale: 3,           // ~355 DPI at 60mm print width - sharp but not huge
      useCORS: true,
      backgroundColor: '#ffffff',
      width: this.CARD_PX_WIDTH,
      height: this.CARD_PX_HEIGHT,
      windowWidth: 1400,   // stay above the 600px mobile breakpoint
      windowHeight: 1000
    });

    document.body.removeChild(holder);
    return canvas;
  }


  private async buildPdf(): Promise<jsPDF> {
    if (!this.frontCard || !this.backCard) {
      throw new Error('ID card is not ready yet');
    }

    const [frontCanvas, backCanvas] = await Promise.all([
      this.renderSide(this.frontCard.nativeElement),
      this.renderSide(this.backCard.nativeElement)
    ]);

   const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth(); // 210mm for A4

    const w = this.CARD_MM_WIDTH;
    const h = this.CARD_MM_HEIGHT;
    const x = (pageW - w) / 2; // centred horizontally on every system
    const topMargin = 15;
    const gap = 12;

    const frontImg = frontCanvas.toDataURL('image/jpeg', 0.92);
    const backImg = backCanvas.toDataURL('image/jpeg', 0.92);

    pdf.addImage(frontImg, 'JPEG', x, topMargin, w, h, undefined, 'FAST');
    pdf.addImage(backImg, 'JPEG', x, topMargin + h + gap, w, h, undefined, 'FAST');

    return pdf;
  }

  /** Print the card via a fixed-geometry PDF so every system prints identically. */
  async printCard(): Promise<void> {
    try {
      const pdf = await this.buildPdf();
      pdf.autoPrint();
      window.open(pdf.output('bloburl') as any, '_blank');
    } catch (err) {
      console.error('Print failed', err);
    }
  }

  /** Save the same fixed-geometry PDF locally (identical to the printed output). */
  async downloadCard(): Promise<void> {
    try {
      const pdf = await this.buildPdf();
      pdf.save(`padyatri-${this.padyatri?.padyatriId || 'id'}.pdf`);
    } catch (err) {
      console.error('Download failed', err);
    }
  }
}
