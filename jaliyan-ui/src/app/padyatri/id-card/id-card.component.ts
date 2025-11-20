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
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-id-card',
  templateUrl: './id-card.component.html',
  styleUrls: ['./id-card.component.css'],
  standalone: false
})
export class IdCardComponent implements OnInit, AfterViewInit {

  photoUrl: string | null = null;
  isFlipped = false;
  currentYear = new Date().getFullYear();

  @ViewChild('qrContainer', { static: false }) qrContainer!: ElementRef;
  @ViewChild('frontCard', { static: false }) frontCard!: ElementRef;
  @ViewChild('backCard', { static: false }) backCard!: ElementRef;

  @Input() showActions: boolean = true;
  @Input() padyatri: any;  // ✅ ADD THIS

  qrImage: string = '';

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
    // 1️⃣ Generate base QR
    const qrCanvas = await QRCode.toCanvas(this.qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 12,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    /** 2️⃣ Load Logo Image */
    const logo = new Image();
    logo.src = 'assets/images/Logo_old.jpg';     // your logo
    await new Promise(res => (logo.onload = res));

    /** 3️⃣ Draw QR + Logo together */
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

    /** 4️⃣ Save final image */
    this.qrImage = finalCanvas.toDataURL('image/png');

  } catch (err) {
    console.error("QR generation with logo failed", err);
  }
}


  //  async generateQR() {
  //   try {
  //     this.qrImage = await QRCode.toDataURL(this.qrData, {
  //       errorCorrectionLevel: 'H', // High error correction
  //       type: 'image/png',
  //       scale: 12,                   // Higher scale = bigger and sharper
  //       margin: 2,
  //       color: {
  //         dark: '#000000',
  //         light: '#FFFFFF'
  //       }
  //     });
  //   } catch (err) {
  //     console.error('QR generation failed', err);
  //   }
  // }

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

  private collectAllStyles(): string {
    let css = '';

    // Pull global <style> tags
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      if (el.tagName === 'STYLE') {
        css += (el as HTMLStyleElement).innerText;
      } else if ((el as HTMLLinkElement).href) {
        css += `@import url("${(el as HTMLLinkElement).href}");`;
      }
    });

    return css;
  }

  private resolveAssetUrl(relativePath: string): string {
    // If it's already absolute, return it
    if (/^https?:\/\//i.test(relativePath)) return relativePath;

    // Build an absolute URL from current origin
    return `${window.location.origin}/${relativePath.replace(/^\/+/, '')}`;
  }


  async printCard(): Promise<void> {
    const front = this.frontCard?.nativeElement;
    const back = this.backCard?.nativeElement;
    if (!front || !back) return;

    // Deep clone
    const frontClone = front.cloneNode(true) as HTMLElement;
    const backClone = back.cloneNode(true) as HTMLElement;

    // --- 1️⃣ Fix missing photo and logo ---
    // --- 1️⃣ Fix missing photo and logo ---
    const photoEl = frontClone.querySelector('.photo') as HTMLImageElement;
    if (photoEl && this.photoUrl) photoEl.src = this.photoUrl;  // base64 data

    const logoEl = frontClone.querySelector('.logo') as HTMLImageElement;
    if (logoEl) {
      const src = logoEl.getAttribute('src');
      if (src) logoEl.src = this.resolveAssetUrl(src);
    }


    // --- 2️⃣ Fix QR code ---
    const qrCanvas = this.qrContainer?.nativeElement?.querySelector('canvas') as HTMLCanvasElement;
    const qrSectionClone = frontClone.querySelector('.qr-section');
    if (qrCanvas && qrSectionClone) {
      const qrImg = new Image();
      qrImg.src = this.qrImage; //qrCanvas.toDataURL('image/png');
      qrImg.width = qrCanvas.width * 3;
      qrImg.height = qrCanvas.height * 3;
      qrSectionClone.innerHTML = ''; // clear old <qrcode> tag
      qrSectionClone.appendChild(qrImg);
    }

    // --- 3️⃣ Wrap both sides ---
    const wrapper = document.createElement('div');
    wrapper.classList.add('print-wrapper');
    wrapper.appendChild(frontClone);
    wrapper.appendChild(backClone);

    // --- 4️⃣ Collect all styles (component + global) ---
    const allCss = this.collectAllStyles();

    const printCss = `
    @page { size: A4; margin: 10mm; }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Noto Sans Gujarati', sans-serif;
    }
    .print-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 25mm;
    }
    .id-card, .front-card, .back-card {
      transform: none !important;
      box-shadow: none !important;
      width: 280px !important;
      aspect-ratio: 5 / 8 !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      position: relative !important;
    }
    svg.card-svg {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 0 !important;
    }
    .front-card > *, .back-card > * {
      position: relative;
      z-index: 2;
    }
  `;

    // --- 5️⃣ Open print window ---
    const printWin = window.open('', '_blank', 'width=800,height=1000');
    if (!printWin) return;

    printWin.document.write(`
    <html>
      <head>
        <title>ID Card</title>
        <style>${allCss}</style>
        <style>${printCss}</style>
      </head>
      <body>${wrapper.outerHTML}</body>
    </html>
  `);
    printWin.document.close();

    await new Promise(r => setTimeout(r, 800));
    printWin.focus();
    printWin.print();
    printWin.close();
  }

async downloadCard(): Promise<void> {
  const front = this.frontCard?.nativeElement;
  const back = this.backCard?.nativeElement;
  if (!front || !back) return;

  // --- Fix photo & logo on both sides ---
  const fixImages = (root: HTMLElement) => {
    const photoEl = root.querySelector('.photo') as HTMLImageElement;
    if (photoEl && this.photoUrl) photoEl.src = this.photoUrl;

    const logoEl = root.querySelector('.logo') as HTMLImageElement;
    if (logoEl) {
      const src = logoEl.getAttribute('src');
      if (src) logoEl.src = this.resolveAssetUrl(src);
    }

    // Fix QR if present
    const qrCanvas = this.qrContainer?.nativeElement?.querySelector('canvas') as HTMLCanvasElement;
    const qrSection = root.querySelector('.qr-section');
    if (qrCanvas && qrSection) {
      const qrImg = new Image();
      qrImg.src = qrCanvas.toDataURL('image/png');
      qrSection.innerHTML = '';
      qrSection.appendChild(qrImg);
    }
  };

  const frontClone = front.cloneNode(true) as HTMLElement;
  const backClone = back.cloneNode(true) as HTMLElement;

  fixImages(frontClone);
  fixImages(backClone);

  // --- Styling for realistic card capture ---
  const baseCss = `
    body {
      background: #fff;
      font-family: 'Noto Sans Gujarati', sans-serif;
    }
    .id-card, .front-card, .back-card {
      width: 280px;
      aspect-ratio: 5 / 8;
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      box-shadow: none !important;
    }
    svg.card-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    .front-card > *, .back-card > * {
      position: relative;
      z-index: 2;
    }
  `;

  // Helper for capturing one side
  const captureSide = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const wrapper = document.createElement('div');
    wrapper.appendChild(element);
    const style = document.createElement('style');
    style.innerHTML = this.collectAllStyles() + baseCss;
    wrapper.prepend(style);
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(wrapper);
    return canvas;
  };

  const frontCanvas = await captureSide(frontClone);
  const backCanvas = await captureSide(backClone);

  // --- Build PDF with real ID card size ---
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Real ID card size (credit-card format): 85.6 × 54 mm
  const cardW = 85.6;
  const cardH = 54;

  const marginX = (210 - cardW) / 2; // center horizontally
  let yPos = 30; // top margin

  // Add front side
  pdf.addImage(
    frontCanvas.toDataURL('image/png'),
    'PNG',
    marginX,
    yPos,
    cardW,
    cardH
  );

  // Add back side below it with small spacing
  yPos += cardH + 10;
  pdf.addImage(
    backCanvas.toDataURL('image/png'),
    'PNG',
    marginX,
    yPos,
    cardW,
    cardH
  );

  // Save file
  pdf.save(`padyatri-${this.padyatri?.padyatriId || 'id'}.pdf`);
}



}
