import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Squelette animé affiché pendant le chargement d'une liste, à la place d'un simple spinner
 * centré : donne une idée immédiate de la forme du tableau à venir (colonnes, lignes) et rend
 * l'attente moins abrupte visuellement.
 */
@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  templateUrl: './table-skeleton.component.html',
  styleUrl: './table-skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableSkeletonComponent {
  @Input() columns = 5;
  @Input() rows = 6;

  get columnArray(): number[] {
    return Array.from({ length: this.columns }, (_, i) => i);
  }

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
