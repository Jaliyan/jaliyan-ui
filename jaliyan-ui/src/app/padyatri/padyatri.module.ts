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
import { PadyatriViewDialogComponent } from './padyatri-view-dialog/padyatri-view-dialog.component';
import { MatChipsModule } from '@angular/material/chips';

// Translation
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Factory function for HTTP loader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}


@NgModule({
  declarations: [RegistrationFormComponent, PadyatriListComponent, 
    IdCardComponent, PrintAllIdCardsDialogComponent, 
    PadyatriViewDialogComponent],
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
    MatSidenavContainer,
    MatChipsModule,
    SharedModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'en'
    })
  ]
})
export class PadyatriModule { }
