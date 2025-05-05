import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  title: string;
  message: string;
  class: string;  // Success, Error, Info, etc.
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  toast$ = this.toastSubject.asObservable();

  constructor() {}

  showToast(title: string, message: string, className: string) {
    this.toastSubject.next({ title, message, class: className });
  }
}
