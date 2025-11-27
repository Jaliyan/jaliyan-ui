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

  // 1️⃣ Global <style> and <link> tags
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
    if (el.tagName === 'STYLE') {
      css += (el as HTMLStyleElement).innerText;
    } else if (el.tagName === 'LINK') {
      const href = (el as HTMLLinkElement).href;
      if (href) {
        css += `@import url("${href}");\n`;
      }
    }
  });

  // 2️⃣ Angular component styles in Shadow DOM / emulated
  const components = document.querySelectorAll('[ng-version]'); // root Angular app
  components.forEach(appEl => {
    const el = appEl as HTMLElement;
    Array.from(el.querySelectorAll('*')).forEach(child => {
      const styles = (child as any).__ngContext__?.[8]; // internal Angular styles
      if (styles) {
        css += styles.toString();
      }
    });
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
  if (!this.frontCard || !this.backCard) return;

  // Clone front and back cards
  const frontClone = this.frontCard.nativeElement.cloneNode(true) as HTMLElement;
  const backClone = this.backCard.nativeElement.cloneNode(true) as HTMLElement;

  // Fix images & QR for print
  const fixImages = (root: HTMLElement) => {
    // Photo
    const photoEl = root.querySelector('.photo') as HTMLImageElement;
    if (photoEl && this.photoUrl) photoEl.src = this.photoUrl;

    // Logo
    const logoEl = root.querySelector('.logo') as HTMLImageElement;
    if (logoEl) logoEl.src = this.resolveAssetUrl(logoEl.src);

    // QR Code
    const qrSection = root.querySelector('.qr-section');
    if (qrSection && this.qrImage) {
      qrSection.innerHTML = '';
      const qrImg = new Image();
      qrImg.src = this.qrImage;
      qrImg.width = 80;
      qrImg.height = 80;
      qrSection.appendChild(qrImg);
    }
  };

  fixImages(frontClone);
  fixImages(backClone);

  // Wrap both cards vertically
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '20mm';
  wrapper.appendChild(frontClone);
  wrapper.appendChild(backClone);

  // Collect all styles (component + global)
  const allCss = this.collectAllStyles();

  // Print-specific styles
  const printCss = `
    /* =======================================
   UNIVERSAL PRINT FIXES
   ======================================= */
@page { size: A4; margin: 10mm; }

body {
  font-family: 'Noto Sans Gujarati', sans-serif;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  background: #fff !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* Disable flex (causes layout shifting in print) */
#wrapper {
  display: block !important;
  width: 100% !important;
  padding: 10px 16px;
}

/* Add spacing between cards */
#wrapper .front-card,
#wrapper .back-card {
  margin-bottom: 30mm !important;
  page-break-inside: avoid !important;
}

/* =======================================
   FIXED CARD SIZING
   ======================================= */
.front-card,
.back-card {
  width: 280px !important;
  height: 450px !important;  /* Adjust if your UI card is slightly taller */
  padding: 0 !important;
  box-sizing: border-box !important;
  border-radius: 20px !important;
  position: relative !important;
  overflow: hidden !important;
}

/* Disable aspect ratio (breaks print height) */
.id-card-wrapper,
.id-card-flip {
  aspect-ratio: unset !important;
  height: auto !important;
}

/* SVG background */
svg.card-svg {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 0 !important;
}

/* Ensure all front/back content stays above SVG */
.front-card > *,
.back-card > * {
  position: relative !important;
  z-index: 2 !important;
}

/* =======================================
   FRONT SIDE (minimal fixes needed)
   ======================================= */
.front-card .photo-container {
  width: 100px !important;
  height: 100px !important;
}
  .front-card .header {
  position: relative;
  z-index: 2;
  /* margin-top: -5px; */
}
.front-card .logo {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  /* margin-bottom: 4px; */
}
.front-card .title {
  font-size: 18px;
  color: whitesmoke;
  /* font-weight: 600; */
  /* text-shadow: 0 0 2px rgba(0, 0, 0, 0.3); */
}

.front-card .photo-container {
  /* width: 90px; */
  height: 100px;
  border-radius: 10px;
  border: 3px solid #fffaf3;
  /* margin-top: -18px; */
  margin-bottom: 10px;
  overflow: hidden;
  /* box-shadow: 0 0 10px rgba(0, 0, 0, 0.2); */
  z-index: 2;
}
.front-card .photo { width: 100%; height: 100%; }

.front-card .info-section {
  z-index: 2;
  margin-top: -10px;
}
.front-card .info-section p {
  margin: 3px 0;
  font-size: 16px;
  color: #4e342e;
  font-weight: 500;
}

/* Footer QR placement */
.front-card .footer {
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* margin-top: auto; pins QR at bottom */
  gap: 10px;
}



/* =======================================
   BACK SIDE FIXES — MAIN ISSUE AREA
   ======================================= */

/* Fix title inside orange band */
.back-card .organizer-title {
  position: absolute !important;
  top: 15px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  font-size: 18px !important;
  color: #fff !important;
  white-space: normal !important;
  text-align: center !important;
  width: 100%;
}

/* Position entire info section exactly */
.back-card .back-info {
  padding: 0 20px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: center !important;
  padding: 0 30px !important;
}

/* Organizer list: remove flex because print breaks flex spacing */
.organizer-grid {
  display: block !important;
  width: 100% !important;
  text-align: center !important;
}

.organizer-grid p {
  margin: 5px 0 !important;
  font-size: 15px !important;
  line-height: 2 !important;
  white-space: normal !important;
}

/* Medical emergency card */
.medical-emergency {
  margin-top: 15px !important;
  padding: 10px 14px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  border: 2px solid red !important;
  border-radius: 10px !important;
}

/* Medical text */
.medical-title {
  color: red !important;
  font-size: 16px !important;
  margin-bottom: 5px !important;
}

.medical-info p {
  margin: 3px 0 !important;
  font-size: 15px !important;
}

/* Footer alignment */
.footer-title-back {
  margin-top: 45px !important;
  font-size: 16px !important;
  text-align: center !important;
  color: whitesmoke !important;
}
  
.back-card {
  color: #333;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Organizer title in orange band */
.back-card .organizer-title {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 18px;
  /* font-weight: 700; */
  text-align: center;
  /* text-shadow: 0 1px 3px rgba(0,0,0,0.4); */
  z-index: 2;
  white-space: nowrap;
}

/* Organizer info centered */
.back-card .back-info {
  z-index: 2;
  text-align: center;
  font-size: 15px;
  color: #4e342e;
  font-weight: 500;
  width: 100%;
  max-width: 500px;
  padding: 0 30px;
}

.organizer-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.organizer-grid p {
  margin: 2px 0;
  font-size: 15px;
  color: #4e342e;
  white-space: nowrap;
  text-align: center;
  line-height: 1.6;
}


  `;

  // Open print window
  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!printWindow) return;

  const htmlCode = `
    <html>
      <head>
        <title>ID Card</title>
        <style>${allCss}</style>
        <style>${printCss}</style>
      </head>
      <body>${wrapper.outerHTML}</body>
    </html>
  `;

  console.log(htmlCode);
  printWindow.document.write(htmlCode);

  printWindow.document.close();

  // Wait for images/fonts to load before printing
  await new Promise(resolve => setTimeout(resolve, 800));

  printWindow.focus();
  printWindow.print();
  printWindow.close();
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
