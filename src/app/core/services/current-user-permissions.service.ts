import { Injectable, computed, inject, signal } from '@angular/core';
import { PermissionService } from './permission.service';

/** Permissions (codenames Django) de l'utilisateur connecté — pilote l'affichage dynamique
 * des boutons/menus/actions dans l'UI. La vérification côté backend reste la source de
 * vérité ; ceci n'est qu'un affichage conditionnel, pas un contrôle d'accès en soi. */
@Injectable({ providedIn: 'root' })
export class CurrentUserPermissionsService {
  private readonly permissionService = inject(PermissionService);

  private readonly codenames = signal<Set<string> | null>(null);
  /** true tant que les permissions n'ont pas encore été chargées — utile pour éviter de
   * masquer des boutons à tort avant la première réponse du serveur. */
  readonly loaded = computed(() => this.codenames() !== null);

  /** Idempotent : ne relance pas l'appel si déjà chargées (appelé depuis app-shell à chaque
   * activation, potentiellement plusieurs fois par session). */
  load(): void {
    if (this.codenames() !== null) {
      return;
    }

    this.permissionService.listMyPermissions().subscribe({
      next: (permissions) => this.codenames.set(new Set(permissions.map((p) => p.codename))),
      error: () => this.codenames.set(new Set())
    });
  }

  has(codename: string): boolean {
    return this.codenames()?.has(codename) ?? true;
  }

  /** À appeler impérativement à la déconnexion : sans ça, les permissions de l'utilisateur
   * précédent restent en mémoire (service singleton) et sont réutilisées pour la session
   * suivante si un autre utilisateur se reconnecte sans recharger complètement la page. */
  reset(): void {
    this.codenames.set(null);
  }
}
