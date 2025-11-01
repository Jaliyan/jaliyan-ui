import { Pipe, PipeTransform } from '@angular/core';
import { englishToGujaratiDigits } from '../common/number-utils';


@Pipe({
  name: 'gujaratiConversion',
  standalone: false
})
export class GujaratiConversionPipe implements PipeTransform {

  private genderMap: { [key: string]: string } = {
    male: 'પુરુષ',
    female: 'સ્ત્રી',
    other: 'અન્ય',
  };

  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';

    let strValue = value.toString().toLowerCase();

    // If gender text, translate
    if (this.genderMap[strValue]) {
      return this.genderMap[strValue];
    }

    // Otherwise, convert numbers to Gujarati
    return englishToGujaratiDigits(value.toString());
  }
}
