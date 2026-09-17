import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission } from '../models/permission.models';
import { RequestCache } from '../utils/request-cache';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  private readonly permissionsCache = new RequestCache(() =>
    this.http.get<Permission[]>(`${environment.backendUrl}/parametrage/auth/list-permission/`)
  );

  /** Permissions de l'utilisateur connecté uniquement (distinct de listPermissions(), qui liste
   * toutes les permissions du système) — utile pour adapter l'UI aux droits réels plutôt qu'à
   * is_staff/is_superuser. */
  private readonly myPermissionsCache = new RequestCache(() =>
    this.http.get<Permission[]>(`${environment.backendUrl}/parametrage/auth/my-list-permission/`)
  );

  listPermissions(): Observable<Permission[]> {
    return this.permissionsCache.get();
  }

  listMyPermissions(): Observable<Permission[]> {
    return this.myPermissionsCache.get();
  }

  /** À appeler à la déconnexion : le cache (shareReplay) sert la même réponse indéfiniment
   * tant qu'il n'est pas invalidé, y compris pour un utilisateur différent qui se reconnecte
   * dans le même onglet. */
  invalidateMyPermissions(): void {
    this.myPermissionsCache.invalidate();
  }
}
