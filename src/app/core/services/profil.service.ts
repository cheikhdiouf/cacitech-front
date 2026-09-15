import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateGroupeRequest, Groupe } from '../models/groupe.models';
import { CreateProfilRequest, Profil } from '../models/profil.models';
import { RequestCache } from '../utils/request-cache';

@Injectable({ providedIn: 'root' })
export class ProfilService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/profil`;

  private readonly groupesCache = new RequestCache(() => this.http.get<Groupe[]>(`${this.baseUrl}/list-groupe/`));
  private readonly profilsCache = new RequestCache(() => this.http.get<Profil[]>(`${this.baseUrl}/list-profil/`));

  listGroupes(): Observable<Groupe[]> {
    return this.groupesCache.get();
  }

  detailGroupe(id: string): Observable<Groupe> {
    return this.http.get<Groupe>(`${this.baseUrl}/detail-groupe/${id}/`);
  }

  createGroupe(request: CreateGroupeRequest): Observable<Groupe> {
    return this.http
      .post<Groupe>(`${this.baseUrl}/create-groupe/`, request)
      .pipe(tap(() => this.groupesCache.invalidate()));
  }

  updateGroupe(id: string, request: CreateGroupeRequest): Observable<Groupe> {
    return this.http
      .put<Groupe>(`${this.baseUrl}/update-groupe/${id}/`, request)
      .pipe(tap(() => this.groupesCache.invalidate()));
  }

  /** Mise à jour partielle (ex. toggle "actif" depuis la liste, sans passer par le formulaire complet). */
  patchGroupe(id: string, changes: Partial<CreateGroupeRequest>): Observable<Groupe> {
    return this.http
      .patch<Groupe>(`${this.baseUrl}/update-groupe/${id}/`, changes)
      .pipe(tap(() => this.groupesCache.invalidate()));
  }

  listProfils(): Observable<Profil[]> {
    return this.profilsCache.get();
  }

  detailProfil(id: string): Observable<Profil> {
    return this.http.get<Profil>(`${this.baseUrl}/detail-profil/${id}/`);
  }

  createProfil(request: CreateProfilRequest): Observable<Profil> {
    return this.http
      .post<Profil>(`${this.baseUrl}/create-profil/`, this.toFormData(request))
      .pipe(tap(() => this.profilsCache.invalidate()));
  }

  updateProfil(id: string, request: CreateProfilRequest): Observable<Profil> {
    return this.http
      .put<Profil>(`${this.baseUrl}/update-profil/${id}/`, this.toFormData(request))
      .pipe(tap(() => this.profilsCache.invalidate()));
  }

  /** Mise à jour partielle en JSON (ex. toggle "actif" depuis la liste) — pas besoin de multipart ici. */
  patchProfil(id: string, changes: Partial<Pick<Profil, 'actif'>>): Observable<Profil> {
    return this.http
      .patch<Profil>(`${this.baseUrl}/update-profil/${id}/`, changes)
      .pipe(tap(() => this.profilsCache.invalidate()));
  }

  /** L'API n'accepte que multipart/form-data pour create/update-profil (upload photo). */
  private toFormData(request: CreateProfilRequest): FormData {
    const formData = new FormData();
    formData.set('email', request.email);
    formData.set('nom', request.nom);
    formData.set('prenom', request.prenom);
    formData.set('entite', request.entite);
    formData.set('fonction', request.fonction);
    formData.set('actif', String(request.actif));
    formData.set('prime', String(request.prime));

    if (request.matricule) {
      formData.set('matricule', request.matricule);
    }
    if (request.telephone) {
      formData.set('telephone', request.telephone);
    }
    if (request.adresse) {
      formData.set('adresse', request.adresse);
    }
    if (request.photo) {
      formData.set('photo', request.photo);
    }
    request.groupes.forEach((groupeId) => formData.append('groupes', groupeId));

    return formData;
  }
}
