import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { AuthGuard } from '../auth/auth.guard';

const routes: Routes = [
  { path: 'register', component: RegistrationFormComponent ,canActivate: [AuthGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PadyatriRoutingModule { }
