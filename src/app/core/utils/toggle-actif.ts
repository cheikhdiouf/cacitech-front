import { WritableSignal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface ToggleActifOptions<T extends { id: string; actif: boolean }> {
  items: WritableSignal<T[]>;
  id: string;
  patch: (id: string, changes: { actif: boolean }) => Observable<unknown>;
  notification: NotificationService;
  labelActivated: string;
  labelDeactivated: string;
  /** Quand fourni, une popup de confirmation s'affiche avant toute désactivation
   * (pas avant une activation, non destructive) — évite qu'un clic accidentel sur le
   * toggle désactive un enregistrement potentiellement référencé ailleurs. */
  dialogService?: DialogService;
  confirmDeactivate?: { title: string; message: string };
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
  labelDeactivated,
  dialogService,
  confirmDeactivate
}: ToggleActifOptions<T>): void {
  const current = items().find((item) => item.id === id);
  if (!current) {
    return;
  }

  const next = !current.actif;

  const apply = (): void => {
    items.update((list) => list.map((item) => (item.id === id ? { ...item, actif: next } : item)));

    patch(id, { actif: next }).subscribe({
      next: () => notification.success(next ? labelActivated : labelDeactivated),
      error: () => {
        items.update((list) => list.map((item) => (item.id === id ? { ...item, actif: !next } : item)));
        notification.error('Impossible de mettre à jour le statut. Veuillez réessayer.');
      }
    });
  };

  if (!next && dialogService && confirmDeactivate) {
    dialogService
      .open(ConfirmDialogComponent, {
        size: 'small',
        data: {
          title: confirmDeactivate.title,
          message: confirmDeactivate.message,
          confirmLabel: 'Désactiver',
          icon: 'toggle_off',
          destructive: true
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          apply();
        }
      });
    return;
  }

  apply();
}

interface BulkSetActifOptions {
  ids: string[];
  actif: boolean;
  patch: (id: string, changes: { actif: boolean }) => Observable<unknown>;
  notification: NotificationService;
  dialogService: DialogService;
  confirmTitle: string;
  confirmMessage: string;
  onDone: () => void;
}

/** Applique "actif"/"inactif" à une sélection multiple (barre d'actions groupées d'un
 * tableau) : une seule confirmation pour tout le lot avant d'envoyer les PATCH en parallèle,
 * puis rechargement de la liste (plus simple qu'une mise à jour optimiste par ligne ici). */
export function bulkSetActif({
  ids,
  actif,
  patch,
  notification,
  dialogService,
  confirmTitle,
  confirmMessage,
  onDone
}: BulkSetActifOptions): void {
  if (ids.length === 0) {
    return;
  }

  const apply = (): void => {
    forkJoin(
      ids.map((id) =>
        patch(id, { actif }).pipe(
          catchError(() => of(null))
        )
      )
    ).subscribe((results) => {
      const failures = results.filter((result) => result === null).length;
      if (failures > 0) {
        notification.error(`${failures} élément(s) n'ont pas pu être mis à jour.`);
      } else {
        notification.success(actif ? 'Éléments activés.' : 'Éléments désactivés.');
      }
      onDone();
    });
  };

  if (!actif) {
    dialogService
      .open(ConfirmDialogComponent, {
        size: 'small',
        data: {
          title: confirmTitle,
          message: confirmMessage,
          confirmLabel: 'Désactiver',
          icon: 'toggle_off',
          destructive: true
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          apply();
        }
      });
    return;
  }

  apply();
}
