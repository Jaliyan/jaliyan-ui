import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PadyatraService } from '../../services/padyatra.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { Padyatra } from '../../common/padyatra.model';
import { PadyatraFormDialogComponent } from '../padyatra-form-dialog/padyatra-form-dialog.component';

@Component({
  selector: 'app-padyatra-manage',
  templateUrl: './padyatra-manage.component.html',
  styleUrls: ['./padyatra-manage.component.css'],
  standalone: false
})
export class PadyatraManageComponent implements OnInit {
  displayedColumns = ['year', 'name', 'dates', 'registrations', 'status', 'actions'];
  padyatras: Padyatra[] = [];
  loading = true;
  userName: string;

  constructor(
    private padyatraService: PadyatraService,
    private toast: ToastService,
    private auth: AuthService,
    private dialog: MatDialog
  ) {
    this.userName = this.auth.getUsername() || 'Admin';
  }

  ngOnInit(): void {
    this.load();
  }

  get activePadyatra(): Padyatra | null {
    return this.padyatras.find(p => p.isActive) ?? null;
  }

  load(): void {
    this.loading = true;
    this.padyatraService.getAll().subscribe({
      next: (data) => {
        this.padyatras = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.toast.show('Failed to load padyatra events.', 'error');
        this.loading = false;
      }
    });
  }

  openForm(padyatra?: Padyatra): void {
    const ref = this.dialog.open(PadyatraFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'admin-form-dialog',
      data: padyatra ? { ...padyatra } : null
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) this.load();
    });
  }

  activate(padyatra: Padyatra): void {
    if (padyatra.isActive) return;
    this.padyatraService.activate({ padyatraId: padyatra.padyatraId, updatedBy: this.userName })
      .subscribe({
        next: () => {
          this.toast.show(`${padyatra.nameEn} (${padyatra.year}) is now active.`, 'success');
          this.load();
        },
        error: () => this.toast.show('Failed to activate padyatra.', 'error')
      });
  }

  deactivate(padyatra: Padyatra): void {
    if (!padyatra.isActive) return;
    const ok = confirm(
      `Disable "${padyatra.nameEn} (${padyatra.year})"?\n` +
      `No padyatra will be active until you activate one. New registrations, ` +
      `stop and menu management will be paused.`
    );
    if (!ok) return;

    this.padyatraService.deactivate({ padyatraId: padyatra.padyatraId, updatedBy: this.userName })
      .subscribe({
        next: () => {
          this.toast.show(`${padyatra.nameEn} (${padyatra.year}) is now disabled.`, 'success');
          this.load();
        },
        error: () => this.toast.show('Failed to disable padyatra.', 'error')
      });
  }

  remove(padyatra: Padyatra): void {
    if (padyatra.isActive) {
      this.toast.show('Cannot delete the active padyatra. Activate another first.', 'warning');
      return;
    }
    const ok = confirm(
      `Delete "${padyatra.nameEn} (${padyatra.year})"?\n` +
      `This is only allowed when it has no registrations.`
    );
    if (!ok) return;

    this.padyatraService.delete(padyatra.padyatraId, this.userName).subscribe({
      next: () => {
        this.toast.show('Padyatra deleted.', 'success');
        this.load();
      },
      error: () => this.toast.show('Failed to delete. It may already have registrations.', 'error')
    });
  }
}
