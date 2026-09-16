/** Prédicat de recherche texte partagé par les 5 listes : vrai si un des champs donnés
 * contient (insensible à la casse) le texte recherché. */
export function makeFilterPredicate<T>(
  ...fields: Array<(row: T) => string | null | undefined>
): (row: T, filter: string) => boolean {
  return (row, filter) => fields.some((field) => (field(row) ?? '').toLowerCase().includes(filter));
}
