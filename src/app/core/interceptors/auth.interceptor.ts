import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService, SKIP_AUTH } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

let refreshInProgress = false;
let redirectingToLogin = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);
  const router = inject(Router);

  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const authorizedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorizedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!authService.getRefreshToken()) {
        redirectToLogin(authService, notification, router);
        return throwError(() => error);
      }

      if (!refreshInProgress) {
        refreshInProgress = true;
        refreshedToken$.next(null);

        authService.refreshToken().subscribe({
          next: (newAccessToken) => {
            refreshInProgress = false;
            refreshedToken$.next(newAccessToken);
          },
          error: () => {
            refreshInProgress = false;
            refreshedToken$.next(null);
            redirectToLogin(authService, notification, router);
          }
        });
      }

      return refreshedToken$.pipe(
        filter((newToken) => newToken !== null || !refreshInProgress),
        take(1),
        switchMap((newToken) => {
          if (!newToken) {
            return throwError(() => error);
          }

          const retriedReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
          return next(retriedReq);
        })
      );
    })
  );
};

/** `redirectingToLogin` évite d'empiler plusieurs toasts/redirections si plusieurs requêtes
 * expirent en même temps. */
function redirectToLogin(authService: AuthService, notification: NotificationService, router: Router): void {
  if (redirectingToLogin) {
    return;
  }
  redirectingToLogin = true;

  authService.logout();
  notification.error('Votre session a expiré. Veuillez vous reconnecter.');
  Promise.resolve(router.navigateByUrl('/auth/connexion')).finally(() => (redirectingToLogin = false));
}
