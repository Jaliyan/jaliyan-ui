import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PadyatriService } from '../../services/padyatri.service';
import { ToastService } from '../../services/toast.service';

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
  photoPreviewUrl: string | ArrayBuffer | null = null;
   preview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private padyatriService: PadyatriService,
    private toastService: ToastService
  ) {}

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
      createdBy: ['Admin', Validators.required]
    });
  }

onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotoFile = input.files[0];
      this.padyatriForm.patchValue({ photo: this.selectedPhotoFile });
      this.padyatriForm.get('photo')?.updateValueAndValidity();

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.preview = e.target.result; // set preview URL
      };
      reader.readAsDataURL(this.selectedPhotoFile);
    }
  }

  onSubmit(): void {
    if (this.padyatriForm.invalid || this.submitting) return;

    const formData = new FormData();

    Object.entries(this.padyatriForm.value).forEach(([key, value]) => {
  if (value !== null && value !== undefined) {
    formData.append(key, value.toString());
  }
});

    if (this.selectedPhotoFile) {
      formData.append('Photo', this.selectedPhotoFile);
    }

    this.submitting = true;

    this.padyatriService.addPadyatri(formData).subscribe({
      next: () => {
        this.toastService.show('Padyatri registered successfully!', 'success');
        this.padyatriForm.reset();
        this.photoPreviewUrl = null;
        this.selectedPhotoFile = null;
        this.submitting = false;
      },
      error: (err) => {
        console.error('Registration failed:', err);
        this.toastService.show('Failed to register Padyatri.', 'error');
        this.submitting = false;
      }
    });
  }
}
