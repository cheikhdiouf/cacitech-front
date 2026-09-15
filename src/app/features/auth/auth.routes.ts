import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout/auth-layout.component';

// Inscription / mot de passe oublié / réinitialisation retirés avec le nettoyage du projet
// (aucun endpoint backend correspondant — voir spec JWT : uniquement /token/ et /token/refresh/).
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'connexion', pathMatch: 'full' },
      {
        path: 'connexion',
        loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
        title: 'Connexion | Cacitech'
      }
    ]
  }
];
