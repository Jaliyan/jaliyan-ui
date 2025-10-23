import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { PadyatriRoutingModule } from './padyatri-routing.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PadyatriListComponent } from './padyatri-list/padyatri-list.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { IdCardComponent } from './id-card/id-card.component';
import { QRCodeComponent} from 'angularx-qrcode';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PrintAllIdCardsDialogComponent } from './print-all-id-cards-dialog/print-all-id-cards-dialog.component';
import { MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';


@NgModule({
  declarations: [RegistrationFormComponent, PadyatriListComponent, IdCardComponent, PrintAllIdCardsDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    PadyatriRoutingModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatDividerModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    QRCodeComponent,
    MatCheckboxModule,
    MatSidenavContent,
    MatSidenavContainer
  ]
})
export class PadyatriModule { }
