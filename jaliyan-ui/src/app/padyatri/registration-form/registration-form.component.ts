import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { PadyatriService } from '../../services/padyatri.service';
import { PadyatraService } from '../../services/padyatra.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Padyatra } from '../../common/padyatra.model';
import { Padyatri } from '../../common/padyatri.model';
import { matchesPadyatriSearch } from '../../common/padyatri-search';

/**
 * A previous-year padyatri offered as a quick-fill suggestion on the
 * registration form. Keeps the source year and batch id for display.
 */
interface PrefillOption {
  padyatri: Padyatri;
  year: number | null;
  batchId: number;
  fullName: string;
}

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css'],
  standalone: false
})
export class RegistrationFormComponent implements OnInit {
  padyatriForm!: FormGroup;
  submitting = false;
  selectedPhotoFile: File | null = null;
  preview: string | null = null;
  editingId: number | null = null;
  formSubmitted = false;
  existingPhotoName: string | null = null;

  // ---- Quick-fill from previous years ----
  prefillControl = new FormControl('');
  prefillSearched = false;
  prefillLoading = false;
  prefillPoolLoaded = false;
  prefillPool: PrefillOption[] = [];
  prefillResults: PrefillOption[] = [];
  prefilledFrom: PrefillOption | null = null;

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private padyatraService: PadyatraService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.padyatriForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      age: [null, [Validators.required, Validators.min(0), Validators.max(999)]],
      gender: ['', Validators.required],
      address: ['', Validators.maxLength(255)],
      mobile: ['', [Validators.required, Validators.maxLength(15)]],
      alternateNumber: ['', Validators.maxLength(15)],
      emergencyContactName: ['', Validators.maxLength(100)],
      emergencyContactNumber: ['', Validators.maxLength(15)],
      padyatraId: [1, Validators.required],
      createdBy: ['Admin', Validators.required],
      updatedBy: ['Admin'],
      padyatriId: [null]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPadyatriById(+id);
  }

  /**
   * Run the search when the user clicks Search (or presses Enter). The first
   * search lazily loads previous years' data from the API; later searches reuse
   * the already-loaded pool. Nothing is fetched until the user searches.
   */
  runPrefillSearch(): void {
    const query = (this.prefillControl.value ?? '').trim();
    this.prefillSearched = true;
    if (!query) {
      this.prefillResults = [];
      return;
    }
    if (this.prefillPoolLoaded) {
      this.filterPrefillResults(query);
    } else if (!this.prefillLoading) {
      this.loadPrefillPool(query);
    }
  }

  /**
   * Load every padyatri registered across all padyatra years into a single
   * searchable pool, de-duplicated by name + phone keeping the most recent year.
   * Previous years are the primary target (prefill last year's details) but the
   * current year is included too so search always has data to match against.
   */
  private loadPrefillPool(query: string): void {
    this.prefillLoading = true;
    this.padyatraService.getAll()
      .pipe(catchError(() => of([] as Padyatra[])))
      .subscribe(padyatras => {
        const sources = (padyatras || [])
          .slice()
          .sort((a, b) => (b.year || 0) - (a.year || 0));

        if (!sources.length) {
          this.prefillPool = [];
          this.prefillPoolLoaded = true;
          this.prefillLoading = false;
          return;
        }

        const requests = sources.map(p =>
          this.padyatriService.getPadyatrisByPadyatra(p.padyatraId).pipe(
            catchError(() => of([] as Padyatri[])),
            map(list => ({ padyatra: p, list }))
          )
        );

        forkJoin(requests)
          .pipe(finalize(() => (this.prefillLoading = false)))
          .subscribe(groups => {
            this.prefillPool = this.buildPool(groups);
            this.prefillPoolLoaded = true;
            this.filterPrefillResults(query);
          });
      });
  }

  /** Flatten per-year results into a de-duplicated pool (most recent year wins). */
  private buildPool(groups: { padyatra: Padyatra; list: Padyatri[] }[]): PrefillOption[] {
    const seen = new Set<string>();
    const pool: PrefillOption[] = [];
    for (const g of groups) {
      for (const p of g.list) {
        const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
        const mobile = (p.mobile ?? '').trim();
        // Unique per person = name + phone. So the same person who gave a
        // different phone each year appears as separate entries (organizer picks
        // the right one), and two different people sharing one phone are both kept.
        const key = `${fullName.toLowerCase()}|${mobile.toLowerCase()}`;
        if ((!fullName && !mobile) || seen.has(key)) continue;
        seen.add(key);
        pool.push({ padyatri: p, year: g.padyatra.year ?? null, batchId: p.batchId, fullName });
      }
    }
    return pool;
  }

  /**
   * Filter the loaded pool by name or phone only (batch id is intentionally not
   * matched here). Works in both Gujarati and English via the shared matcher.
   */
  private filterPrefillResults(query: string): void {
    const q = query.trim();
    if (!q) {
      this.prefillResults = [];
      return;
    }
    this.prefillResults = this.prefillPool
      .filter(o => matchesPadyatriSearch(
        { name: o.fullName, mobile: o.padyatri.mobile },
        q
      ))
      .slice(0, 20);
  }

  /** Copy a previous-year padyatri's details into the form (photo excluded). */
  applyPrefill(opt: PrefillOption): void {
    const p = opt.padyatri;
    this.padyatriForm.patchValue({
      firstName: p.firstName,
      lastName: p.lastName,
      age: p.age,
      gender: p.gender,
      address: p.address,
      mobile: p.mobile,
      alternateNumber: p.alternateNumber,
      emergencyContactName: p.emergencyContactName,
      emergencyContactNumber: p.emergencyContactNumber
    });
    this.prefilledFrom = opt;
    this.prefillControl.setValue('', { emitEvent: false });
    this.prefillResults = [];
    this.prefillSearched = false;
  }

  /** Dismiss the prefill notice and clear the copied personal/contact fields. */
  clearPrefill(): void {
    this.padyatriForm.patchValue({
      firstName: '',
      lastName: '',
      age: null,
      gender: '',
      address: '',
      mobile: '',
      alternateNumber: '',
      emergencyContactName: '',
      emergencyContactNumber: ''
    });
    this.prefilledFrom = null;
  }

  loadPadyatriById(id: number): void {
    this.padyatriService.getPadyatriById(id).subscribe({
      next: (data) => {
        this.padyatriForm.patchValue({
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          gender: data.gender,
          address: data.address,
          mobile: data.mobile,
          alternateNumber: data.alternateNumber,
          emergencyContactName: data.emergencyContactName,
          emergencyContactNumber: data.emergencyContactNumber,
          padyatraId: data.padyatraId,
          createdBy: data.createdBy || 'Admin'
        });

        if (data.photoPath) {
          this.existingPhotoName = data.photoPath;
          this.loadPhoto(data.photoPath);
        }
        this.editingId = id;
      },
      error: () => this.toastService.show('Failed to load Padyatri data.', 'error')
    });
  }

  loadPhoto(photoPath: string) {
    this.padyatriService.getPadyatriImageAsBlob(photoPath).subscribe({
      next: (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = () => this.preview = reader.result as string;
        reader.readAsDataURL(blob);
      },
      error: () => this.preview = null
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.preview = e.target.result;
      reader.readAsDataURL(this.selectedPhotoFile);
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.padyatriForm.invalid || this.submitting) return;

    const formData = new FormData();
    Object.entries(this.padyatriForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) formData.append(key, value.toString());
    });

    if (this.selectedPhotoFile) formData.append('Photo', this.selectedPhotoFile);
    else if (this.existingPhotoName && this.editingId) formData.append('PhotoPath', this.existingPhotoName);

    if (this.editingId) {
      formData.append('PadyatriId', this.editingId.toString());
      formData.append('UpdatedBy', 'Admin');
    }

    this.submitting = true;
    const request$ = this.editingId
      ? this.padyatriService.updatePadyatri(formData)
      : this.padyatriService.addPadyatri(formData);

    request$.subscribe({
      next: () => {
        this.toastService.show(this.editingId ? 'Padyatri updated successfully!' : 'Padyatri registered successfully!', 'success');
        this.router.navigate(['/padyatri/list']);
      },
      error: () => {
        this.toastService.show('Operation failed. Please try again.', 'error');
        this.submitting = false;
      }
    });
  }
}
