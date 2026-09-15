/**
 * Identité de l'utilisateur connecté. Le backend JWT (endpoint /api/token/) ne renvoie que des
 * tokens, aucune information de profil — le seul identifiant fiable côté front est le nom
 * d'utilisateur saisi au login.
 */
export interface User {
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

/** Réponse brute de POST /api/token/. */
export interface TokenResponse {
  access: string;
  refresh: string;
}

/** Réponse brute de POST /api/token/refresh/. */
export interface RefreshResponse {
  access: string;
}

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'SESSION_EXPIRED' | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}
