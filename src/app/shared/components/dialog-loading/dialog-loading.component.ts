import { Component, Input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Contenu de remplacement centré, le temps que les données de référence d'une popup se chargent.
 * `minHeight` doit correspondre à la hauteur approximative du formulaire final de chaque popup,
 * pour éviter que MatDialog ne la recentre brusquement (effet de "saut") au chargement terminé. */
@Component({
  selector: 'app-dialog-loading',
  standalone: true,
  imports: [MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './dialog-loading.component.html',
  styleUrl: './dialog-loading.component.css'
})
export class DialogLoadingComponent {
  @Input() minHeight = 320;
}
