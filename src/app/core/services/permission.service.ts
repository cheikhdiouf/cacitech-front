import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permission } from '../models/permission.models';
import { RequestCache } from '../utils/request-cache';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);

  private readonly permissionsCache = new RequestCache(() =>
    this.http.get<Permission[]>(`${environment.backendUrl}/parametrage/auth/list-permission/`)
  );

  listPermissions(): Observable<Permission[]> {
    return this.permissionsCache.get();
  }
}
