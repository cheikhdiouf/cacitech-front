export interface Groupe {
  id: string;
  group: number;
  nom: string;
  actif: boolean;
  description: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  permissions: number[];
  profils: string[];
}

export interface CreateGroupeRequest {
  nom: string;
  description: string;
  actif: boolean;
  permissions: number[];
}
