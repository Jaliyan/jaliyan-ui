import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, Validators, AbstractControl } from '@angular/forms';
import { StopService } from '../../services/stop.service';
import { PadyatraService } from '../../services/padyatra.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Padyatra } from '../../common/padyatra.model';
import { Stop } from '../../common/stop.model';

@Component({
  selector: 'app-stop-manage',
  templateUrl: './stop-manage.component.html',
  styleUrls: ['./stop-manage.component.css'],
  standalone: false
})
export class StopManageComponent implements OnInit {
  /** Stops are managed for the single ACTIVE padyatra. Past years are read-only in the archive. */
  activePadyatra: Padyatra | null = null;
  stops: Stop[] = [];
  loading = true;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;
  userName: string;

  @ViewChild(FormGroupDirective) private formDir?: FormGroupDirective;

  constructor(
    private stopService: StopService,
    private padyatraService: PadyatraService,
    private toast: ToastService,
    private auth: AuthService,
    private fb: FormBuilder
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nameGu: ['', [Validators.required, Validators.maxLength(150)]],
      nameEn: ['', [Validators.required, Validators.maxLength(150)]],
      mapUrl: ['', [
        Validators.maxLength(500),
        (control: AbstractControl) => control.value ? Validators.pattern(/^https?:\/\/.+/)(control) : null
      ]]
    });

    this.loading = true;
    this.padyatraService.getActive().subscribe({
      next: (p) => {
        this.activePadyatra = p ?? null;
        if (this.activePadyatra) {
          this.loadStops();
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.activePadyatra = null;
        this.loading = false;
      }
    });
  }

  loadStops(): void {
    if (!this.activePadyatra) {
      this.stops = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.stopService.getByPadyatra(this.activePadyatra.padyatraId).subscribe({
      next: (stops) => {
        this.stops = stops ?? [];
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load stops.', 'error');
        this.loading = false;
      }
    });
  }

  edit(stop: Stop): void {
    this.editingId = stop.stopId ?? null;
    this.form.patchValue({
      nameGu: stop.nameGu,
      nameEn: stop.nameEn,
      mapUrl: stop.mapUrl ?? ''
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.formDir?.resetForm({ nameGu: '', nameEn: '', mapUrl: '' });
    this.form.reset({ nameGu: '', nameEn: '', mapUrl: '' });
  }

  save(): void {
    if (!this.activePadyatra) {
      this.toast.show('Activate a padyatra first.', 'warning');
      return;
    }
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.value;
    const base = {
      padyatraId: this.activePadyatra.padyatraId,
      nameGu: v.nameGu.trim(),
      nameEn: v.nameEn.trim(),
      mapUrl: (v.mapUrl || '').trim()
    };

    const request$ = this.editingId
      ? this.stopService.update({ ...base, stopId: this.editingId, updatedBy: this.userName })
      : this.stopService.create({ ...base, createdBy: this.userName });

    request$.subscribe({
      next: () => {
        this.toast.show(this.editingId ? 'Stop updated.' : 'Stop added.', 'success');
        this.saving = false;
        this.cancelEdit();
        this.loadStops();
      },
      error: () => {
        this.saving = false;
        this.toast.show('Failed to save stop.', 'error');
      }
    });
  }

  remove(stop: Stop): void {
    const ok = confirm(`Delete stop "${stop.nameEn}"?`);
    if (!ok) return;
    this.stopService.delete(stop.stopId, this.userName).subscribe({
      next: () => {
        this.toast.show('Stop deleted.', 'success');
        if (this.editingId === stop.stopId) this.cancelEdit();
        this.loadStops();
      },
      error: () => this.toast.show('Failed to delete. It may be used in a planned menu.', 'error')
    });
  }

  openMap(stop: Stop): void {
    if (stop.mapUrl) window.open(stop.mapUrl, '_blank', 'noopener');
  }
}
