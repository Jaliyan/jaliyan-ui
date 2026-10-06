import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../auth/auth.guard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { PadyatraManageComponent } from './padyatra-manage/padyatra-manage.component';
import { StopManageComponent } from './stop-manage/stop-manage.component';
import { MenuItemManageComponent } from './menu-item-manage/menu-item-manage.component';
import { MenuTypeManageComponent } from './menu-type-manage/menu-type-manage.component';
import { PadyatraArchiveComponent } from './padyatra-archive/padyatra-archive.component';

const routes: Routes = [
  { path: '', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'padyatra', component: PadyatraManageComponent, canActivate: [AuthGuard] },
  { path: 'stops', component: StopManageComponent, canActivate: [AuthGuard] },
  { path: 'menu-items', component: MenuItemManageComponent, canActivate: [AuthGuard] },
  { path: 'menu-types', component: MenuTypeManageComponent, canActivate: [AuthGuard] },
  { path: 'archive', component: PadyatraArchiveComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
