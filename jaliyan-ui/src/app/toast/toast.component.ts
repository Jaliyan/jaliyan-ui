import { Component, OnInit } from '@angular/core';
import { Toast, ToastService } from '../services/toast.service';


@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe((toast: Toast) => {
      this.toasts.push(toast);
      // Automatically hide toast after 3 seconds
      setTimeout(() => this.removeToast(toast), 3000);
    });
  }

  removeToast(toast: Toast) {
    const index = this.toasts.indexOf(toast);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }
  }
}
