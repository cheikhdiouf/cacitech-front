import { Component, Input, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/** En-tête de popup réutilisable : titre centré + bouton de fermeture explicite, pour ne pas
 * dépendre uniquement du clic hors-zone ou de la touche Échap pour quitter. Ferme la popup
 * avec `false` (comme "Annuler"), quel que soit le formulaire qu'elle habille. */
@Component({
  selector: 'app-dialog-header',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.css'
})
export class DialogHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() icon: string | null = null;

  private readonly dialogRef = inject(MatDialogRef<unknown, boolean>);

  close(): void {
    this.dialogRef.close(false);
  }
}
