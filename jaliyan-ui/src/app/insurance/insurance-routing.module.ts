import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { InsuranceMappingComponent } from './insurance-mapping/insurance-mapping.component';

const routes: Routes = [
  { path: 'list', component: InsuranceMappingComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsuranceRoutingModule {}
