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
