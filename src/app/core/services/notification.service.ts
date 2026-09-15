import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DEFAULT_CONFIG = { horizontalPosition: 'end', verticalPosition: 'top' } as const;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Fermer', { ...DEFAULT_CONFIG, duration: 4000, panelClass: 'app-snackbar-success' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fermer', { ...DEFAULT_CONFIG, duration: 5000, panelClass: 'app-snackbar-error' });
  }
}
