import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/** Affiche la barre de chargement globale pendant les requêtes GET uniquement — les
 * écritures (POST/PUT/PATCH) ont déjà leur propre indicateur local (bouton "isSubmitting",
 * spinner de popup...), doubler avec la barre globale serait redondant et trompeur. */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const loadingService = inject(LoadingService);

  loadingService.show();

  return next(req).pipe(finalize(() => loadingService.hide()));
};
