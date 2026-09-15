import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Paire de boutons Annuler / Valider, réutilisée par tous les formulaires (popup ou page) :
 * centralise le libellé selon le mode édition/création et l'état "en cours d'envoi". */
@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './form-actions.component.html',
  styleUrl: './form-actions.component.css'
})
export class FormActionsComponent {
  @Input() isEdit = false;
  @Input() submitting = false;
  @Input() cancelLabel = 'Annuler';
  @Input() createLabel = 'Créer';
  @Input() editLabel = 'Enregistrer';

  @Output() cancel = new EventEmitter<void>();

  get submitLabel(): string {
    return this.isEdit ? this.editLabel : this.createLabel;
  }
}
