import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateFonctionRequest, CreateOrganeRequest, Fonction, Organe } from '../models/organigramme.models';
import { RequestCache } from '../utils/request-cache';

@Injectable({ providedIn: 'root' })
export class OrganigrammeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/organigramme`;

  private readonly organesCache = new RequestCache(() => this.http.get<Organe[]>(`${this.baseUrl}/list-organe/`));
  private readonly fonctionsCache = new RequestCache(() =>
    this.http.get<Fonction[]>(`${this.baseUrl}/list-fonction/`)
  );

  listOrganes(): Observable<Organe[]> {
    return this.organesCache.get();
  }

  detailOrgane(id: string): Observable<Organe> {
    return this.http.get<Organe>(`${this.baseUrl}/detail-organe/${id}/`);
  }

  createOrgane(request: CreateOrganeRequest): Observable<Organe> {
    return this.http
      .post<Organe>(`${this.baseUrl}/create-organe/`, request)
      .pipe(tap(() => this.organesCache.invalidate()));
  }

  updateOrgane(id: string, request: CreateOrganeRequest): Observable<Organe> {
    return this.http
      .put<Organe>(`${this.baseUrl}/update-organe/${id}/`, request)
      .pipe(tap(() => this.organesCache.invalidate()));
  }

  /** Mise à jour partielle (ex. toggle "actif" depuis la liste, sans passer par le formulaire complet). */
  patchOrgane(id: string, changes: Partial<CreateOrganeRequest>): Observable<Organe> {
    return this.http
      .patch<Organe>(`${this.baseUrl}/update-organe/${id}/`, changes)
      .pipe(tap(() => this.organesCache.invalidate()));
  }

  listFonctions(): Observable<Fonction[]> {
    return this.fonctionsCache.get();
  }

  detailFonction(id: string): Observable<Fonction> {
    return this.http.get<Fonction>(`${this.baseUrl}/detail-fonction/${id}/`);
  }

  createFonction(request: CreateFonctionRequest): Observable<Fonction> {
    return this.http
      .post<Fonction>(`${this.baseUrl}/create-fonction/`, request)
      .pipe(tap(() => this.fonctionsCache.invalidate()));
  }

  updateFonction(id: string, request: CreateFonctionRequest): Observable<Fonction> {
    return this.http
      .put<Fonction>(`${this.baseUrl}/update-fonction/${id}/`, request)
      .pipe(tap(() => this.fonctionsCache.invalidate()));
  }

  /** Mise à jour partielle (ex. toggle "actif" depuis la liste, sans passer par le formulaire complet). */
  patchFonction(id: string, changes: Partial<CreateFonctionRequest>): Observable<Fonction> {
    return this.http
      .patch<Fonction>(`${this.baseUrl}/update-fonction/${id}/`, changes)
      .pipe(tap(() => this.fonctionsCache.invalidate()));
  }
}
