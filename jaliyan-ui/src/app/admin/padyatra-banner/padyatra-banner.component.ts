import { Component, Input } from '@angular/core';
import { Padyatra } from '../../common/padyatra.model';
import { englishToGujaratiDigits, formatGujaratiDate } from '../../common/number-utils';

/**
 * Shared banner shown on every admin screen. Mirrors the ID-card header style:
 * the event name in Gujarati + the year, with the date range in Gujarati.
 * e.g. "શ્રી જલારામ પદયાત્રા - ૨૦૨૬" / "૧૭ ડિસેમ્બર ૨૦૨૬ થી ૨૦ ડિસેમ્બર ૨૦૨૬".
 */
@Component({
  selector: 'app-padyatra-banner',
  templateUrl: './padyatra-banner.component.html',
  styleUrls: ['./padyatra-banner.component.css'],
  standalone: false
})
export class PadyatraBannerComponent {
  @Input() padyatra: Padyatra | null = null;

  get yearGu(): string {
    return this.padyatra ? englishToGujaratiDigits(this.padyatra.year) : '';
  }

  get dateRangeGu(): string {
    if (!this.padyatra?.startDate || !this.padyatra?.endDate) return '';
    return `${formatGujaratiDate(this.padyatra.startDate)} થી ${formatGujaratiDate(this.padyatra.endDate)}`;
  }
}
