import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-print-all-id-cards-dialog',
  standalone: false,
  templateUrl: './print-all-id-cards-dialog.component.html',
  styleUrl: './print-all-id-cards-dialog.component.css'
})
export class PrintAllIdCardsDialogComponent implements OnInit {
  padyatris: any[] = [];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const state = history.state;
    this.padyatris = state?.data || [];
    if (!this.padyatris.length) {
      this.router.navigate(['/']); // redirect if accessed directly
    }
  }

  printAll(): void {
    setTimeout(() => window.print(), 300);
  }
}