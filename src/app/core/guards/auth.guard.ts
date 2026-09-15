import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Protège les routes qui nécessitent une session active.
 *
 * L'access token n'est jamais persisté (volontairement, en mémoire uniquement) : à chaque
 * rechargement de page, il est donc perdu même si la session reste valide (refresh token en
 * storage). Sans ce garde, les composants de la route déclenchent aussitôt leurs appels API
 * sans token → 401 en cascade sur toutes les requêtes de la page, rattrapées après coup par
 * l'interceptor. On rafraîchit ici l'access token *avant* d'activer la route pour éviter ces
 * 401 systématiques au premier chargement. */
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
