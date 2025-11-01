import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GujaratiConversionPipe } from './gujarati-conversion.pipe';


@NgModule({
  declarations: [GujaratiConversionPipe],
  imports: [CommonModule],
  exports: [GujaratiConversionPipe]  // <-- export so other modules can use it
})
export class SharedModule {}
