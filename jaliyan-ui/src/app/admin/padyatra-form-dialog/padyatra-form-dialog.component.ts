import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PadyatraService } from '../../services/padyatra.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Padyatra } from '../../common/padyatra.model';

/**
 * Add / edit a yearly Padyatra event. Batch ids restart from 1 for every event
 * because attendance / insurance / distribution are all scoped by padyatraId.
 */
@Component({
  selector: 'app-padyatra-form-dialog',
  templateUrl: './padyatra-form-dialog.component.html',
  styleUrls: ['./padyatra-form-dialog.component.css'],
  standalone: false
})
export class PadyatraFormDialogComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  isEdit = false;
  userName: string;

  constructor(
    private fb: FormBuilder,
    private padyatraService: PadyatraService,
    private toast: ToastService,
    private auth: AuthService,
    private dialogRef: MatDialogRef<PadyatraFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Padyatra | null
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.isEdit = !!this.data;
    const currentYear = new Date().getFullYear();

    this.form = this.fb.group({
      padyatraId: [this.data?.padyatraId ?? null],
      nameEn: [this.data?.nameEn ?? '', [Validators.required, Validators.maxLength(150)]],
      nameGu: [this.data?.nameGu ?? '', [Validators.required, Validators.maxLength(150)]],
      year: [
        this.data?.year ?? currentYear,
        [Validators.required, Validators.min(2000), Validators.max(2100)]
      ],
      startDate: [this.data?.startDate ?? '', Validators.required],
      endDate: [this.data?.endDate ?? '', Validators.required],
      descriptionEn: [this.data?.descriptionEn ?? '', Validators.maxLength(500)],
      descriptionGu: [this.data?.descriptionGu ?? '', Validators.maxLength(500)]
    }, { validators: [this.dateRangeValidator] });
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && new Date(end) < new Date(start)) {
      return { dateRange: true };
    }
    return null;
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
    const payload = {
      nameEn: v.nameEn.trim(),
      nameGu: v.nameGu.trim(),
      year: v.year,
      startDate: this.toIsoDate(v.startDate),
      endDate: this.toIsoDate(v.endDate),
      descriptionEn: v.descriptionEn?.trim() || '',
      descriptionGu: v.descriptionGu?.trim() || ''
    };

    this.submitting = true;
    const request$ = this.isEdit
      ? this.padyatraService.update({ ...payload, padyatraId: v.padyatraId, updatedBy: this.userName })
      : this.padyatraService.create({ ...payload, createdBy: this.userName });

    request$.subscribe({
      next: () => {
        this.toast.show(this.isEdit ? 'Padyatra updated.' : 'Padyatra created.', 'success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.submitting = false;
        const msg = err?.error?.message || 'Failed to save padyatra. A year may already exist.';
        this.toast.show(msg, 'error');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
