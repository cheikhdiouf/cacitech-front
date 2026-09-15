import { MatPaginatorIntl } from '@angular/material/paginator';

/** Traduit les libellés de MatPaginator ("Items per page", "of") en français — fourni comme
 * provider global une seule fois (app.config.ts) plutôt que dupliqué sur chaque liste. */
export function provideFrenchPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();

  intl.itemsPerPageLabel = 'Éléments par page :';
  intl.nextPageLabel = 'Page suivante';
  intl.previousPageLabel = 'Page précédente';
  intl.firstPageLabel = 'Première page';
  intl.lastPageLabel = 'Dernière page';

  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 sur ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} sur ${length}`;
  };

  return intl;
}
