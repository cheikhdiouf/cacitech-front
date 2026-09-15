import { Observable, shareReplay } from 'rxjs';

/**
 * Cache un Observable "liste de référence" (peu volatile, lu depuis plusieurs écrans) pour éviter
 * de refaire la requête HTTP à chaque navigation. `invalidate()` doit être appelé après toute
 * mutation (create/update) qui change les données concernées, pour forcer un refetch au prochain get().
 */
export class RequestCache<T> {
  private cached$: Observable<T> | null = null;

  constructor(private readonly factory: () => Observable<T>) {}

  get(): Observable<T> {
    if (!this.cached$) {
      this.cached$ = this.factory().pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.cached$;
  }

  invalidate(): void {
    this.cached$ = null;
  }
}
