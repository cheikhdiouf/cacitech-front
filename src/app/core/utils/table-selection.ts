import { SelectionModel } from '@angular/cdk/collections';

/**
 * Sélection multiple pour une mat-table : encapsule le SelectionModel du CDK avec la logique
 * de "tout sélectionner" et le libellé d'accessibilité, identiques sur chaque liste (Entité,
 * Fonction, Groupe, Profil) mais dépendant chacune de leurs propres lignes filtrées et du champ
 * à afficher dans le libellé.
 */
export class TableSelection<T> {
  private readonly model = new SelectionModel<T>(true, []);

  constructor(
    private readonly getRows: () => T[],
    private readonly labelFor: (row: T) => string
  ) {}

  get selected(): T[] {
    return this.model.selected;
  }

  hasValue(): boolean {
    return this.model.hasValue();
  }

  isSelected(row: T): boolean {
    return this.model.isSelected(row);
  }

  toggle(row: T): void {
    this.model.toggle(row);
  }

  clear(): void {
    this.model.clear();
  }

  isAllSelected(): boolean {
    const rows = this.getRows();
    return rows.length > 0 && this.model.selected.length === rows.length;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.model.clear();
    } else {
      this.model.select(...this.getRows());
    }
  }

  checkboxLabel(row?: T): string {
    if (!row) {
      return `${this.isAllSelected() ? 'Désélectionner' : 'Sélectionner'} toutes les lignes`;
    }
    return `${this.isSelected(row) ? 'Désélectionner' : 'Sélectionner'} « ${this.labelFor(row)} »`;
  }
}
