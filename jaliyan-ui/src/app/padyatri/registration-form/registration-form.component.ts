import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.padyatriForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      age: [null, [Validators.required, Validators.min(0), Validators.max(150)]],
      gender: ['', Validators.required],
      address: ['', Validators.maxLength(255)],
      mobile: ['', [Validators.required, Validators.maxLength(15)]],
      alternateNumber: ['', Validators.maxLength(15)],
      emergencyContactName: ['', Validators.maxLength(100)],
      emergencyContactNumber: ['', Validators.maxLength(15)],
      padyatraId: [1, Validators.required],
      createdBy: ['Admin', Validators.required],
      updatedBy: ['Admin'], // Optional
      padyatriId: [null]    // Optional
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPadyatriById(+id);
    }
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

        if (data?.photoPath) {
          this.existingPhotoName = data.photoPath;
          this.loadPhoto(data.photoPath);
        }

        this.editingId = id;
      },
      error: () => {
        this.toastService.show('Failed to load Padyatri data.', 'error');
      }
    });
  }


  loadPhoto(photoPath: string) {
    this.padyatriService.getPadyatriImageAsBlob(photoPath).subscribe({
      next: (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.preview = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },
      error: (err: any) => {
        console.error('Image load failed', err);
        this.preview = null;
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotoFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.preview = e.target.result;
      };
      reader.readAsDataURL(this.selectedPhotoFile);
    }
  }

  onSubmit(): void {
    this.formSubmitted = true;

    if (this.padyatriForm.invalid || this.submitting) return;

    const formData = new FormData();

    // Append form values
    Object.entries(this.padyatriForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append new photo file if selected
    if (this.selectedPhotoFile) {
      formData.append('Photo', this.selectedPhotoFile);
    } else if (this.existingPhotoName && this.editingId) {
      formData.append('PhotoPath', this.existingPhotoName);
    }

    if (this.editingId) {
      formData.append('PadyatriId', this.editingId.toString());
      formData.append('UpdatedBy', 'Admin'); // Replace with actual username from auth
    }

    this.submitting = true;

    const request$ = this.editingId
      ? this.padyatriService.updatePadyatri(formData)
      : this.padyatriService.addPadyatri(formData);

    request$.subscribe({
      next: () => {
        const msg = this.editingId
          ? 'Padyatri updated successfully!'
          : 'Padyatri registered successfully!';
        this.toastService.show(msg, 'success');
        this.router.navigate(['/padyatri/list']);
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.toastService.show('Operation failed. Please try again.', 'error');
        this.submitting = false;
      }
    });
  }

  // Helper to get just the file name from a path/url
  private extractFileNameFromPath(path: string): string {
    return path.split('\\').pop()?.split('/').pop() || '';
  }

}
