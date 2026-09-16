import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Rafraîchit l'access token avant d'activer la route (perdu à chaque rechargement, non
 * persisté) pour éviter un 401 en cascade sur les appels API du premier chargement. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loginRedirect = () => router.createUrlTree(['/auth/connexion'], { queryParams: { redirectTo: state.url } });

  if (authService.getAccessToken()) {
    return true;
  }

  if (!authService.getRefreshToken()) {
    return loginRedirect();
  }

  return authService.refreshToken().pipe(
    map(() => true),
    catchError(() => of(loginRedirect()))
  );
};
