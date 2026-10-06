import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Displays dates as dd-MMM-yyyy (e.g. 26-Jul-2026) in the INPUT only.
 *  All calendar labels (period button, month/year views) use native formatting. */
@Injectable()
export class DdMmmYyyyDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = MONTHS[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return super.format(date, displayFormat);
  }
}

export const DD_MMM_YYYY_FORMATS = {
  parse: {
    dateInput: null as unknown as Object
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};
