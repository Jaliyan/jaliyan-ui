import { Injectable } from '@angular/core';
import { MatSnackBar,  
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition, } from '@angular/material/snack-bar';

export interface Toast {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';  // Success, Error, Info, etc.
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  
  constructor(private snackBar: MatSnackBar) {}

  horizontalPosition: MatSnackBarHorizontalPosition = 'right';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  
  show(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    const config = {
      duration: 2000, // Duration for snack bar
      horizontalPosition : this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      panelClass: this.getPanelClass(type)
    };

    this.snackBar.open(message, 'X', config);
  }

  private getPanelClass(type: 'success' | 'error' | 'warning' | 'info') {
    switch (type) {
      case 'success':
        return ['snackbar-success'];
      case 'error':
        return ['snackbar-error'];
      case 'warning':
        return ['snackbar-warning'];
      case 'info':
        return ['snackbar-info'];
      default:
        return ['snackbar-info'];
    }
  }

}
