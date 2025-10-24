import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth/auth.guard';
import { FoodMenuComponent } from './food-menu/food-menu.component';
import { MenuPlannerComponent } from './menu-planner/menu-planner.component';
import { PublicInfoDashboardComponent } from './public-info-dashboard/public-info-dashboard.component';

const routes: Routes = [
  // { path: 'schedule', component: ScheduleComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'infodashboard', component: PublicInfoDashboardComponent },
  { path: 'foodmenu', component:  FoodMenuComponent,canActivate: [AuthGuard] },
  { path: 'menuplanner', component:  MenuPlannerComponent,canActivate: [AuthGuard] },
  {
    path: 'padyatri',
    loadChildren: () => import('./padyatri/padyatri.module').then(m => m.PadyatriModule)
  },
  {
    path: 'attendance',
    loadChildren: () => import('./qr/qr.module').then(m => m.QrModule)
  },

  { path: '**', redirectTo: 'home' } // Wildcard route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
