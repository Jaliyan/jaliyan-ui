import { Component, OnInit } from '@angular/core';
import { InsuranceService } from '../../services/insurance.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PadyatriInsurance, InsuranceSummary } from '../../common/insurance.model';
import { padyatriSearchPredicate } from '../../common/padyatri-search';
import { DataGridColumn, DataGridQuickFilter } from '../../shared/data-grid/data-grid.types';

@Component({
  selector: 'app-insurance-mapping',
  templateUrl: './insurance-mapping.component.html',
  styleUrls: ['./insurance-mapping.component.css'],
  standalone: false
})
export class InsuranceMappingComponent implements OnInit {
  /** Rows shown in the grid. */
  rows: PadyatriInsurance[] = [];

  /** Grid column configuration. */
  columns: DataGridColumn[] = [];

  /** Quick status filter chips (the grid prepends an "All" chip). */
  quickFilters: DataGridQuickFilter[] = [
    { key: 'pending', label: 'Pending', predicate: (r) => !r.insuranceReceived },
    { key: 'received', label: 'Received', predicate: (r) => r.insuranceReceived }
  ];

  /** Shared name/batch/mobile search reused by the grid. */
  searchPredicate = padyatriSearchPredicate;

  summary: InsuranceSummary = { total: 0, received: 0, pending: 0 };
  loading = false;
  updatingId: number | null = null;

  constructor(
    private insuranceService: InsuranceService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildColumns();
    this.loadList();
  }

  private buildColumns(): void {
    this.columns = [
      {
        key: 'name', header: 'Name', type: 'avatar',
        sortable: true, filterable: true,
        format: (_v, row) => row.fullName
      },
      {
        key: 'batchId', header: 'Batch ID', type: 'badge',
        sortable: true, filterable: true, gujaratiDigits: true
      },
      {
        key: 'mobile', header: 'Mobile', type: 'text',
        sortable: true, filterable: true, icon: 'call'
      },
      {
        key: 'insuranceReceived', header: 'Status', type: 'status',
        sortable: true,
        statusTrueLabel: 'Received', statusFalseLabel: 'Pending', statusTruePositive: true
      }
    ];
  }

  /** Coverage percentage for the progress bar. */
  get coveragePercent(): number {
    return this.summary.total ? Math.round((this.summary.received / this.summary.total) * 100) : 0;
  }

  loadList(): void {
    this.loading = true;
    this.insuranceService.getInsuranceList().subscribe({
      next: data => {
        this.rows = data;
        this.updateSummary(data);
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to load insurance list', 'error');
        this.loading = false;
      }
    });
  }

  toggleReceived(row: PadyatriInsurance): void {
    const received = !row.insuranceReceived;
    this.updatingId = row.padyatriId;

    this.insuranceService
      .markInsurance({
        padyatriId: row.padyatriId,
        received,
        markedBy: this.authService.getUsername() ?? ''
      })
      .subscribe({
        next: () => {
          row.insuranceReceived = received;
          row.receivedTime = received ? new Date().toISOString() : null;
          this.updateSummary(this.rows);
          this.rows = [...this.rows]; // re-trigger the grid's filtering
          this.updatingId = null;
          this.toastService.show(
            received ? 'Insurance marked as received' : 'Insurance mark removed',
            'success'
          );
        },
        error: () => {
          this.updatingId = null;
          this.toastService.show('Could not update insurance status', 'error');
        }
      });
  }

  private updateSummary(data: PadyatriInsurance[]): void {
    const received = data.filter(d => d.insuranceReceived).length;
    this.summary = {
      total: data.length,
      received,
      pending: data.length - received
    };
  }
}
