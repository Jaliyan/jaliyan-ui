import { Component, Input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

let _uid = 0;

type Variant = 'on-dark' | 'on-light';

interface Theme {
  rings: string[];
  core: string;
  coreGlow: string;
  halo: string;
}

const THEMES: Record<Variant, Theme> = {
  // light golds for dark surfaces (deep / clay)
  'on-dark': {
    rings: ['#E7D6BC', '#CBA378', '#DB8A5B', '#F0DCB0', '#C9A227'],
    core: '#FBEFCB', coreGlow: '#F5D98A', halo: '#F6E3B0',
  },
  // deep clay / blue for light surfaces (cream / ivory)
  'on-light': {
    rings: ['#C86D39', '#A9552A', '#2E4C63', '#B98F63', '#8A5A2B'],
    core: '#C86D39', coreGlow: '#C86D39', halo: '#A9552A',
  },
};

/**
 * Animated "રામ" mandala — concentric rings of the word રામ rotating in
 * alternating directions (slow, smooth, CSS-driven). Inline SVG so it animates.
 * Use `variant` to keep it visible on dark vs light backgrounds.
 */
@Component({
  selector: 'app-ram-mandala',
  standalone: true,
  template: `<span class="rm-host" [innerHTML]="svg"></span>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; pointer-events: none; line-height: 0; }
    .rm-host { display: block; width: 100%; height: 100%; }
    .rm-host svg { display: block; width: 100%; height: 100%; }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class RamMandalaComponent {
  private _variant: Variant = 'on-dark';
  private _rings = 15;
  private readonly uid = `rm${++_uid}`;

  svg!: SafeHtml;

  @Input() set variant(v: Variant) { this._variant = v || 'on-dark'; this.render(); }
  get variant(): Variant { return this._variant; }

  @Input() set rings(n: number | string) {
    const parsed = typeof n === 'string' ? parseInt(n, 10) : n;
    if (parsed && parsed >= 4 && parsed <= 26) { this._rings = parsed; this.render(); }
  }

  constructor(private sanitizer: DomSanitizer) { this.render(); }

  private render(): void {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.build());
  }

  private build(): string {
    const SIZE = 1000, CX = 500, CY = 500;
    const RINGS = this._rings, R_MIN = 74, R_MAX = 468;
    const th = THEMES[this._variant];
    const id = this.uid;

    const circlePath = (r: number) =>
      `M ${CX} ${CY - r} A ${r} ${r} 0 1 1 ${CX} ${CY + r} A ${r} ${r} 0 1 1 ${CX} ${CY - r}`;

    let defs = '';
    let rings = '';

    for (let i = 0; i < RINGS; i++) {
      const t = i / (RINGS - 1);
      const r = R_MIN + t * (R_MAX - R_MIN);
      const C = 2 * Math.PI * r;
      const fs = Math.max(16, r * 0.06);
      const reps = Math.max(6, Math.ceil(C / (fs * 1.55)));
      const text = 'રામ '.repeat(reps);
      const dir = i % 2 === 0 ? 1 : -1;
      const dur = (150 + t * 150).toFixed(0);
      const color = th.rings[i % th.rings.length];
      const opacity = (0.6 + 0.35 * (1 - Math.abs(t - 0.5) * 1.15)).toFixed(2);

      defs += `<path id="${id}-r${i}" d="${circlePath(r)}"/>`;
      rings += `<g class="${id}-ring ${dir > 0 ? id + '-cw' : id + '-ccw'}" style="animation-duration:${dur}s" opacity="${opacity}">`
        + `<text font-family="'Noto Serif Gujarati',serif" font-weight="600" letter-spacing="0.5" font-size="${fs.toFixed(1)}" fill="${color}" textLength="${C.toFixed(1)}" lengthAdjust="spacingAndGlyphs">`
        + `<textPath href="#${id}-r${i}" startOffset="0">${text}</textPath></text></g>`;
    }

    return `<svg viewBox="0 0 ${SIZE} ${SIZE}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`
      + `<defs>${defs}`
      + `<radialGradient id="${id}-glow" cx="50%" cy="50%" r="50%">`
      + `<stop offset="0%" stop-color="${th.coreGlow}" stop-opacity="0.85"/>`
      + `<stop offset="45%" stop-color="${th.coreGlow}" stop-opacity="0.30"/>`
      + `<stop offset="100%" stop-color="${th.coreGlow}" stop-opacity="0"/>`
      + `</radialGradient>`
      + `<filter id="${id}-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5"/></filter>`
      + `</defs>`
      + `<style>`
      + `.${id}-ring{transform-box:view-box;transform-origin:${CX}px ${CY}px;will-change:transform}`
      + `.${id}-cw{animation:${id}-cw linear infinite}`
      + `.${id}-ccw{animation:${id}-ccw linear infinite}`
      + `@keyframes ${id}-cw{to{transform:rotate(360deg)}}`
      + `@keyframes ${id}-ccw{to{transform:rotate(-360deg)}}`
      + `.${id}-core{animation:${id}-core 5s ease-in-out infinite;transform-box:view-box;transform-origin:${CX}px ${CY}px}`
      + `@keyframes ${id}-core{0%,100%{transform:scale(.94)}50%{transform:scale(1.06)}}`
      + `</style>`
      + rings
      + `<circle class="${id}-core" cx="${CX}" cy="${CY}" r="122" fill="url(#${id}-glow)"/>`
      + `<text x="${CX}" y="${CY}" text-anchor="middle" dominant-baseline="central" font-family="'Noto Serif Gujarati',serif" font-weight="700" font-size="92" fill="${th.halo}" filter="url(#${id}-soft)">રામ</text>`
      + `<text x="${CX}" y="${CY}" text-anchor="middle" dominant-baseline="central" font-family="'Noto Serif Gujarati',serif" font-weight="700" font-size="88" fill="${th.core}">રામ</text>`
      + `</svg>`;
  }
}
