import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PadyatriService } from '../../services/padyatri.service';

@Component({
  selector: 'app-padyatri-view-dialog',
  standalone: false,
  templateUrl: './padyatri-view-dialog.component.html',
  styleUrl: './padyatri-view-dialog.component.css'
})
export class PadyatriViewDialogComponent implements OnInit {

  photoUrl: string | null = null;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<PadyatriViewDialogComponent>,
    private padyatriService: PadyatriService
  ) {}

  ngOnInit(): void {
    this.loadPhoto(this.data.photoPath);
  }
  closeDialog() {
    this.dialogRef.close();
  }

  loadPhoto(photoPath: string) {
    this.padyatriService.getPadyatriImageAsBlob(photoPath).subscribe({
      next: (blob: Blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.photoUrl = reader.result as string;
        };
        reader.readAsDataURL(blob);
      },
      error: (err: any) => {
        console.error('Image load failed', err);
        this.photoUrl = null;
      }
    });
  }
}
