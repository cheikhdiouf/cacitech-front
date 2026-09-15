export interface Organe {
  id: string;
  organe: string;
  organe_superieure: string | null;
  responsable: string | null;
  abreviation: string;
  niveau: number;
  actif: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface Fonction {
  id: string;
  fonction: string;
  abreviation: string | null;
  description: string | null;
  actif: boolean;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganeRequest {
  organe: string;
  organe_superieure: string | null;
  responsable: string | null;
  abreviation: string;
  actif: boolean;
}

export interface CreateFonctionRequest {
  fonction: string;
  abreviation: string | null;
  description: string | null;
  actif: boolean;
}
