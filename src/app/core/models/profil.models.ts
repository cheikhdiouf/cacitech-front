export interface Profil {
  id: string;
  user: number;
  matricule: string | null;
  email: string;
  nom: string;
  prenom: string;
  entite: string;
  fonction: string;
  telephone: string | null;
  adresse: string | null;
  actif: boolean;
  prime: number;
  photo: string | null;
  is_staff: boolean;
  is_superuser: boolean;
  groupes: string[];
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

/** Envoyé en multipart/form-data (upload photo) — le backend n'accepte que ce format en création. */
export interface CreateProfilRequest {
  matricule: string | null;
  email: string;
  nom: string;
  prenom: string;
  entite: string;
  fonction: string;
  telephone: string | null;
  adresse: string | null;
  actif: boolean;
  prime: number;
  photo: File | null;
  groupes: string[];
}
