import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    service.logout();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login réussi : stocke access (mémoire) et refresh, authentifie l’utilisateur', () => {
    let result: unknown;
    service.login({ username: 'cheikh', password: 'secret', rememberMe: true }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`${environment.apiUrl}/token/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'cheikh', password: 'secret' });
    req.flush({ access: 'access-1', refresh: 'refresh-1' });

    expect(result).toBeTruthy();
    expect(service.getAccessToken()).toBe('access-1');
    expect(service.getRefreshToken()).toBe('refresh-1');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.username).toBe('cheikh');
  });

  it('login avec mauvais identifiants (401) : renvoie une erreur générique, aucune session', () => {
    let error: { code: string; message: string } | undefined;
    service.login({ username: 'cheikh', password: 'mauvais', rememberMe: false }).subscribe({
      error: (err) => (error = err)
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/token/`);
    req.flush({ detail: 'No active account found with the given credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(error?.code).toBe('INVALID_CREDENTIALS');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('absence d’access token : getAccessToken() renvoie null avant tout login', () => {
    expect(service.getAccessToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refresh réussi : remplace l’access token en mémoire', () => {
    service.login({ username: 'cheikh', password: 'secret', rememberMe: true }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/token/`).flush({ access: 'access-1', refresh: 'refresh-1' });

    let newToken: string | undefined;
    service.refreshToken().subscribe((t) => (newToken = t));

    const refreshReq = httpMock.expectOne(`${environment.apiUrl}/token/refresh/`);
    expect(refreshReq.request.body).toEqual({ refresh: 'refresh-1' });
    refreshReq.flush({ access: 'access-2' });

    expect(newToken).toBe('access-2');
    expect(service.getAccessToken()).toBe('access-2');
  });

  it('refresh invalide/expiré : déconnecte l’utilisateur', () => {
    service.login({ username: 'cheikh', password: 'secret', rememberMe: true }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/token/`).flush({ access: 'access-1', refresh: 'refresh-1' });

    let error: unknown;
    service.refreshToken().subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(`${environment.apiUrl}/token/refresh/`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('refresh sans refresh token disponible : échoue immédiatement sans appel réseau', () => {
    let error: unknown;
    service.refreshToken().subscribe({ error: (err) => (error = err) });

    httpMock.expectNone(`${environment.apiUrl}/token/refresh/`);
    expect(error).toBeTruthy();
  });

  it('logout : supprime les tokens et réinitialise l’utilisateur courant', () => {
    service.login({ username: 'cheikh', password: 'secret', rememberMe: true }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/token/`).flush({ access: 'access-1', refresh: 'refresh-1' });

    service.logout();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
