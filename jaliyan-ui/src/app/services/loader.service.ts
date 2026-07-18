// loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading.asObservable();

  private requestCount = 0;
  private timer: any;
  private readonly DEBOUNCE_TIME = 1; // show spinner only if request > 1ms

  show() {
    this.requestCount++;
    if (this.requestCount === 1) {
      this.timer = setTimeout(() => {
        if (this.requestCount > 0) {
          this.loading.next(true);
        }
      }, this.DEBOUNCE_TIME);
    }
  }

  hide() {
    if (this.requestCount > 0) this.requestCount--;
    if (this.requestCount === 0) {
      clearTimeout(this.timer);
      this.loading.next(false);
    }
  }
}
