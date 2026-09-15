import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/** Barre de progression fine affichée en haut de l'écran pendant les chargements globaux. */
@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [],
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.css'
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);

  readonly isLoading = this.loadingService.isLoading;
}
