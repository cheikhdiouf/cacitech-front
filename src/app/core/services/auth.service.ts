import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthError, AuthSession, LoginRequest, RefreshResponse, TokenResponse, User } from '../models/auth.models';

const REFRESH_TOKEN_KEY = 'cicatech.auth.refreshToken';
const REMEMBER_KEY = 'cicatech.auth.remember';
const USERNAME_KEY = 'cicatech.auth.username';

/** Marque une requête comme publique (pas de header Authorization, pas de refresh sur 401). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** Access token en mémoire uniquement (jamais persisté) ; refresh token en storage — un cookie
 * HttpOnly serait préférable mais le backend ne le pose pas lui-même. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(this.restoreUser());
  private refreshTokenValue: string | null = this.restoreRefreshToken();

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null && this.refreshTokenValue !== null);

  login(request: LoginRequest): Observable<AuthSession> {
    const body = { username: request.username, password: request.password };

    return this.http.post<TokenResponse>(`${environment.apiUrl}/token/`, body, { context: new HttpContext().set(SKIP_AUTH, true) }).pipe(
      map((tokens) => this.applySession(request.username, tokens, request.rememberMe)),
      catchError((err) => {
        if (err?.status === 401) {
          return this.fail('INVALID_CREDENTIALS', 'Identifiants incorrects ou compte inactif.');
        }
        return this.fail('UNKNOWN', 'Une erreur est survenue. Veuillez réessayer.');
      })
    );
  }

  /** Appelée par l'interceptor sur 401 — ne doit jamais elle-même déclencher un refresh. */
  refreshToken(): Observable<string> {
    const refresh = this.refreshTokenValue;

    if (!refresh) {
      return throwError((): AuthError => ({ code: 'SESSION_EXPIRED', message: 'Votre session a expiré. Veuillez vous reconnecter.' }));
    }

    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/token/refresh/`, { refresh }, { context: new HttpContext().set(SKIP_AUTH, true) })
      .pipe(
        map((res) => {
          this.accessTokenSignal.set(res.access);
          return res.access;
        }),
        catchError(() => {
          this.logout();
          return throwError(
            (): AuthError => ({ code: 'SESSION_EXPIRED', message: 'Votre session a expiré. Veuillez vous reconnecter.' })
          );
        })
      );
  }

  logout(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.refreshTokenValue = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      localStorage.removeItem(USERNAME_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USERNAME_KEY);
    }
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  private applySession(username: string, tokens: TokenResponse, remember: boolean): AuthSession {
    const user: User = { username };

    this.accessTokenSignal.set(tokens.access);
    this.userSignal.set(user);
    this.refreshTokenValue = tokens.refresh;

    if (typeof localStorage !== 'undefined') {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
      store.setItem(USERNAME_KEY, username);
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, '1');
      }
    }

    return { user, tokens: { accessToken: tokens.access, refreshToken: tokens.refresh } };
  }

  /** Restaure juste l'identité affichée (évite un flash) — l'access token, non persisté, est
   * perdu au rechargement ; un vrai login reste nécessaire. */
  private restoreUser(): User | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const username = localStorage.getItem(USERNAME_KEY) ?? sessionStorage.getItem(USERNAME_KEY);
    return username ? { username } : null;
  }

  private restoreRefreshToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private fail(code: AuthError['code'], message: string): Observable<never> {
    return throwError((): AuthError => ({ code, message }));
  }
}
