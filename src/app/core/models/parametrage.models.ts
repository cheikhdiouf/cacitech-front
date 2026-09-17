export interface SecteurActivite {
  id: string;
  libelle: string;
  description: string | null;
  actif: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSecteurActiviteRequest {
  libelle: string;
  description: string | null;
  actif: boolean;
}

/** Forme non documentée par le spec OpenAPI (réponse "No response body") — à corriger dès
 * qu'un exemple réel de réponse est disponible. */
export interface Pays {
  code: string;
  nom: string;
}
