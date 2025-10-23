import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'
import { AuthGuard } from '../auth/auth.guard';
import { QrScanComponent } from './qr-scan/qr-scan.component';

const routes: Routes = [
  { path: 'qrscan', component: QrScanComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class QRRoutingModule { }
