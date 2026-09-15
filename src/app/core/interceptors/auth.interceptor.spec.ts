import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    authService.logout();
  });

  afterEach(() => httpMock.verify());

  function login(): void {
    authService.login({ username: 'cheikh', password: 'secret', rememberMe: true }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/token/`).flush({ access: 'access-1', refresh: 'refresh-1' });
  }

  it('ajoute Authorization: Bearer <access> sur une requête protégée', () => {
    login();

    http.get('/api/facturation/factures').subscribe();
    const req = httpMock.expectOne('/api/facturation/factures');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({});
  });

  it('n’ajoute pas Authorization aux endpoints publics /token/ et /token/refresh/', () => {
    login();

    authService.refreshToken().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/token/refresh/`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ access: 'access-2' });
  });

  it('401 sur une requête protégée : rafraîchit puis rejoue la requête une seule fois', () => {
    login();

    let result: unknown;
    http.get('/api/facturation/factures').subscribe((r) => (result = r));

    const first = httpMock.expectOne('/api/facturation/factures');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = httpMock.expectOne(`${environment.apiUrl}/token/refresh/`);
    refresh.flush({ access: 'access-2' });

    const retried = httpMock.expectOne('/api/facturation/factures');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer access-2');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('plusieurs 401 simultanés : un seul appel de refresh (pas de boucle)', () => {
    login();

    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();

    httpMock.expectOne('/api/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/b').flush({}, { status: 401, statusText: 'Unauthorized' });

    // Un seul appel de refresh doit avoir été déclenché malgré les deux 401 — expectOne
    // échouerait déjà si un second appel de refresh avait été émis en parallèle.
    const refresh = httpMock.expectOne(`${environment.apiUrl}/token/refresh/`);
    expect(refresh.request.body).toEqual({ refresh: 'refresh-1' });
    refresh.flush({ access: 'access-2' });

    httpMock.expectOne('/api/a').flush({ ok: true });
    httpMock.expectOne('/api/b').flush({ ok: true });
  });

  it('refresh invalide sur 401 : déconnecte et redirige vers /auth/connexion', () => {
    login();
    const navigateSpy = spyOn(router, 'navigateByUrl');

    http.get('/api/facturation/factures').subscribe({ error: () => {} });
    httpMock.expectOne('/api/facturation/factures').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${environment.apiUrl}/token/refresh/`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authService.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith('/auth/connexion');
  });

  it('accès à une route protégée sans access token : requête part sans Authorization', () => {
    http.get('/api/facturation/factures').subscribe();
    const req = httpMock.expectOne('/api/facturation/factures');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
