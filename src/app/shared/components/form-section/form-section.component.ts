import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Titre de sous-section dans un formulaire (icône + libellé), pour regrouper visuellement
 * des champs apparentés au sein d'une même popup (ex: "Informations personnelles", "Sécurité"). */
@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.css'
})
export class FormSectionComponent {
  @Input({ required: true }) label!: string;
  @Input() icon: string | null = null;
}
