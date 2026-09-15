import { Injectable, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

export type DialogSize = 'small' | 'medium' | 'large';

/** Largeurs standard des popups de l'application — un seul endroit à ajuster pour changer
 * la taille de toutes les modales "small" (formulaires courts), "medium" (formulaires avec
 * listes déroulantes) ou "large" (contenus plus riches). */
const DIALOG_WIDTHS: Record<DialogSize, string> = {
  small: '420px',
  medium: '560px',
  large: '760px'
};

export interface OpenDialogOptions<D> {
  size?: DialogSize;
  data?: D;
  autoFocus?: boolean;
  disableClose?: boolean;
}

/** Point d'entrée unique pour ouvrir une popup Material : uniformise largeur, largeur max
 * responsive et focus initial, pour que chaque écran n'ait pas à redéfinir ces réglages. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  open<T, D = unknown, R = unknown>(component: ComponentType<T>, options: OpenDialogOptions<D> = {}): MatDialogRef<T, R> {
    const { size = 'medium', data, autoFocus = false, disableClose = false } = options;

    const config: MatDialogConfig<D> = {
      width: DIALOG_WIDTHS[size],
      maxWidth: '95vw',
      /** Le thème Material plafonne mat-dialog-content à 65vh par défaut — trop bas sur une
       * fenêtre peu haute, ça fait apparaître un ascenseur même pour un formulaire court.
       * On relève la limite à la hauteur de la popup elle-même : le scroll interne ne se
       * déclenche alors que si le contenu dépasse réellement l'espace disponible à l'écran. */
      maxHeight: '90vh',
      autoFocus,
      disableClose,
      data
    };

    return this.dialog.open<T, D, R>(component, config);
  }
}
