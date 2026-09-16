import { SelectionModel } from '@angular/cdk/collections';

/** Sélection multiple partagée par les 5 listes (checkbox "tout sélectionner" + libellés a11y). */
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
