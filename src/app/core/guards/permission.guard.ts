import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { CurrentUserPermissionsService } from '../services/current-user-permissions.service';

/** Bloque l'accès direct par URL à une route dont le menu est masqué faute de permission —
 * le menu seul ne suffit pas, un utilisateur peut toujours taper l'URL. Attend explicitement
 * la fin du premier chargement des permissions avant de décider (contrairement à la directive
 * `*appHasPermission`, qui affiche les boutons par défaut le temps du chargement pour éviter un
 * flash de contenu) : ici on privilégie la prudence, pas le confort visuel. */
export function permissionGuard(codenames: string[]): CanActivateFn {
  return () => {
    const permissions = inject(CurrentUserPermissionsService);
    const router = inject(Router);

    permissions.load();

    return toObservable(permissions.loaded).pipe(
      filter((loaded) => loaded),
      take(1),
      map(() => (codenames.some((codename) => permissions.has(codename)) ? true : router.createUrlTree(['/accueil'])))
    );
  };
}
