import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { StopService } from '../../services/stop.service';
import { MenuplannerService } from '../../services/menuplanner.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Stop } from '../../common/stop.model';
import { MealType } from '../../common/fooditem.model';

interface StopDialogData {
  padyatraId: number;
  stop: Stop | null;
}

@Component({
  selector: 'app-stop-form-dialog',
  templateUrl: './stop-form-dialog.component.html',
  styleUrls: ['./stop-form-dialog.component.css'],
  standalone: false
})
export class StopFormDialogComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  isEdit = false;
  userName: string;
  mealTypes: MealType[] = [];

  constructor(
    private fb: FormBuilder,
    private stopService: StopService,
    private menuService: MenuplannerService,
    private toast: ToastService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<StopFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StopDialogData
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    const stop = this.data.stop;
    this.isEdit = !!stop;

    this.menuService.getMealTypes().subscribe({
      next: (types) => this.mealTypes = types ?? [],
      error: () => this.mealTypes = []
    });

    this.form = this.fb.group({
      stopId: [stop?.stopId ?? null],
      nameGu: [stop?.nameGu ?? '', [Validators.required, Validators.maxLength(150)]],
      nameEn: [stop?.nameEn ?? '', [Validators.required, Validators.maxLength(150)]],
      dayNumber: [stop?.dayNumber ?? 1, [Validators.required, Validators.min(1), Validators.max(60)]],
      sequence: [stop?.sequence ?? 1, [Validators.required, Validators.min(1), Validators.max(100)]],
      mealTypeId: [stop?.mealTypeId ?? null],
      stopDate: [stop?.stopDate ?? ''],
      mapUrl: [stop?.mapUrl ?? '', [
        Validators.maxLength(500),
        // A blank map URL is allowed; validate the pattern only when a value is present.
        (control: AbstractControl) => control.value ? Validators.pattern(/^https?:\/\/.+/)(control) : null
      ]]
    });
  }

  private toIsoDate(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
  }

  save(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const base = {
      padyatraId: this.data.padyatraId,
      nameGu: v.nameGu.trim(),
      nameEn: v.nameEn.trim(),
      dayNumber: v.dayNumber,
      sequence: v.sequence,
      mealTypeId: v.mealTypeId ?? null,
      stopDate: this.toIsoDate(v.stopDate),
      mapUrl: v.mapUrl?.trim() || ''
    };

    this.submitting = true;
    const request$ = this.isEdit
      ? this.stopService.update({ ...base, stopId: v.stopId, updatedBy: this.userName })
      : this.stopService.create({ ...base, createdBy: this.userName });

    request$.subscribe({
      next: () => {
        this.toast.show(this.isEdit ? 'Stop updated.' : 'Stop added.', 'success');
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting = false;
        this.toast.show('Failed to save stop.', 'error');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
