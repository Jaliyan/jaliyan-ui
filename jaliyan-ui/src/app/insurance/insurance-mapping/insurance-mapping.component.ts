import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { InsuranceService } from '../../services/insurance.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { PadyatriInsurance, InsuranceSummary } from '../../common/insurance.model';
import { matchesPadyatriSearch } from '../../common/padyatri-search';

type StatusFilter = 'all' | 'received' | 'pending';

@Component({
  selector: 'app-insurance-mapping',
  templateUrl: './insurance-mapping.component.html',
  styleUrls: ['./insurance-mapping.component.css'],
  standalone: false
})
export class InsuranceMappingComponent implements OnInit {
  displayedColumns: string[] = ['batchId', 'name', 'mobile', 'status', 'actions'];
  dataSource = new MatTableDataSource<PadyatriInsurance>([]);

  summary: InsuranceSummary = { total: 0, received: 0, pending: 0 };
  statusFilter: StatusFilter = 'all';
  searchText = '';
  loading = false;
  isMobile = false;
  updatingId: number | null = null;

  // The table (and its paginator/sort) live inside an *ngIf that is false until
  // data has loaded, so setters attach them to the dataSource the moment they
  // appear in the DOM. Using ngAfterViewInit would run too early and leave the
  // paginator disconnected ("0 of 0").
  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor(
    private insuranceService: InsuranceService,
    private toastService: ToastService,
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .subscribe(result => (this.isMobile = result.matches));
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => this.matchesFilter(row, filter);
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.insuranceService.getInsuranceList().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.updateSummary(data);
        this.applyCurrentFilter();
        this.loading = false;
        if (this.dataSource.paginator) {
          this.dataSource.paginator.firstPage();
        }
      },
      error: () => {
        this.toastService.show('Failed to load insurance list', 'error');
        this.loading = false;
      }
    });
  }

  /** Coverage percentage for the progress bar. */
  get coveragePercent(): number {
    return this.summary.total ? Math.round((this.summary.received / this.summary.total) * 100) : 0;
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.applyCurrentFilter();
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter = filter;
    this.applyCurrentFilter();
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
          this.updateSummary(this.dataSource.data);
          this.applyCurrentFilter();
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

  /**
   * A single filter string is fed to MatTable's filterPredicate. We pack both the
   * status filter and the free-text search into it (separated by "|") so a single
   * predicate can honour both.
   */
  private applyCurrentFilter(): void {
    this.dataSource.filter = `${this.statusFilter}|${this.searchText.trim().toLowerCase()}`;
  }

  private matchesFilter(row: PadyatriInsurance, filter: string): boolean {
    const [status, ...rest] = filter.split('|');
    const query = rest.join('|');

    // Status filter
    if (status === 'received' && !row.insuranceReceived) {
      return false;
    }
    if (status === 'pending' && row.insuranceReceived) {
      return false;
    }

    // Free-text search by name or batch id (English / Gujarati), shared with the
    // other list screens so matching behaviour stays consistent.
    return matchesPadyatriSearch(
      { name: row.fullName, batchId: row.batchId, mobile: row.mobile },
      query
    );
  }
}
