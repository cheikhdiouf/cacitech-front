import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateSecteurActiviteRequest, Pays, SecteurActivite } from '../models/parametrage.models';
import { RequestCache } from '../utils/request-cache';

@Injectable({ providedIn: 'root' })
export class ParametrageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.backendUrl}/parametrage`;

  private readonly secteursCache = new RequestCache(() =>
    this.http.get<SecteurActivite[]>(`${this.baseUrl}/list-secteuractivite/`)
  );

  /** Peu volatile (liste de référence géographique) : mise en cache comme les autres listes. */
  private readonly paysCache = new RequestCache(() => this.http.get<Pays[]>(`${this.baseUrl}/list-pays/`));

  listPays(): Observable<Pays[]> {
    return this.paysCache.get();
  }

  listSecteursActivite(): Observable<SecteurActivite[]> {
    return this.secteursCache.get();
  }

  detailSecteurActivite(id: string): Observable<SecteurActivite> {
    return this.http.get<SecteurActivite>(`${this.baseUrl}/detail-secteuractivite/${id}/`);
  }

  createSecteurActivite(request: CreateSecteurActiviteRequest): Observable<SecteurActivite> {
    return this.http
      .post<SecteurActivite>(`${this.baseUrl}/create-secteuractivite/`, request)
      .pipe(tap(() => this.secteursCache.invalidate()));
  }

  updateSecteurActivite(id: string, request: CreateSecteurActiviteRequest): Observable<SecteurActivite> {
    return this.http
      .put<SecteurActivite>(`${this.baseUrl}/update-secteuractivite/${id}/`, request)
      .pipe(tap(() => this.secteursCache.invalidate()));
  }

  /** Mise à jour partielle (ex. toggle "actif" depuis la liste, sans passer par le formulaire complet). */
  patchSecteurActivite(id: string, changes: Partial<CreateSecteurActiviteRequest>): Observable<SecteurActivite> {
    return this.http
      .patch<SecteurActivite>(`${this.baseUrl}/update-secteuractivite/${id}/`, changes)
      .pipe(tap(() => this.secteursCache.invalidate()));
  }
}
