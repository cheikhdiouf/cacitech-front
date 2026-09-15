import { WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from '../services/notification.service';

interface ToggleActifOptions<T extends { id: string; actif: boolean }> {
  items: WritableSignal<T[]>;
  id: string;
  patch: (id: string, changes: { actif: boolean }) => Observable<unknown>;
  notification: NotificationService;
  labelActivated: string;
  labelDeactivated: string;
}

/**
 * Bascule "actif" depuis une liste sans passer par le formulaire complet : mise à jour optimiste
 * immédiate, puis confirmation ou rollback silencieux si le PATCH échoue. Partagé entre toutes les
 * listes (Groupe, Profil, Organe, Fonction) qui exposent ce même toggle.
 */
export function toggleActif<T extends { id: string; actif: boolean }>({
  items,
  id,
  patch,
  notification,
  labelActivated,
  labelDeactivated
}: ToggleActifOptions<T>): void {
  const current = items().find((item) => item.id === id);
  if (!current) {
    return;
  }

  const next = !current.actif;
  items.update((list) => list.map((item) => (item.id === id ? { ...item, actif: next } : item)));

  patch(id, { actif: next }).subscribe({
    next: () => notification.success(next ? labelActivated : labelDeactivated),
    error: () => {
      items.update((list) => list.map((item) => (item.id === id ? { ...item, actif: !next } : item)));
      notification.error('Impossible de mettre à jour le statut. Veuillez réessayer.');
    }
  });
}
