import { Injectable, computed, signal } from '@angular/core';

/**
 * État de chargement global de l'application.
 * Utilise un compteur pour gérer plusieurs requêtes/navigations concurrentes
 * sans masquer la barre de chargement tant que tout n'est pas terminé.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeCount = signal(0);

  readonly isLoading = computed(() => this.activeCount() > 0);

  show(): void {
    this.activeCount.update((count) => count + 1);
  }

  hide(): void {
    this.activeCount.update((count) => Math.max(0, count - 1));
  }
}
