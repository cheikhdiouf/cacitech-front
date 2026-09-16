import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Affiche une valeur en lecture seule (icône + libellé + valeur) dans les popups "détail",
 * à la place d'un champ de formulaire désactivé — plus lisible qu'un input grisé. */
@Component({
  selector: 'app-detail-field',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './detail-field.component.html',
  styleUrl: './detail-field.component.css'
})
export class DetailFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() icon: string | null = null;
  @Input() value: string | null | undefined = null;
  /** Colore la valeur (ex: statut Actif/Inactif) avec le même vert/rouge sémantique que le
   * reste de l'app plutôt qu'un texte neutre, pour rester scannable d'un coup d'œil. */
  @Input() tone: 'success' | 'error' | null = null;
}
