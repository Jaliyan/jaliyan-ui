import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { AuthGuard } from '../auth/auth.guard';
import { PadyatriListComponent } from './padyatri-list/padyatri-list.component';
import { PrintAllIdCardsDialogComponent } from './print-all-id-cards-dialog/print-all-id-cards-dialog.component';

const routes: Routes = [
  // { path: 'register', component: RegistrationFormComponent, canActivate: [AuthGuard] },
  {path: 'list', component: PadyatriListComponent, canActivate: [AuthGuard]},
  {path: 'print-id-cards', component: PrintAllIdCardsDialogComponent, canActivate: [AuthGuard]},
  { path: 'add', component: RegistrationFormComponent,canActivate: [AuthGuard] },
  { path: 'edit/:id', component: RegistrationFormComponent,canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PadyatriRoutingModule { }
