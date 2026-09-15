import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/** Authentification + accueil provisoire — ajouter les vrais écrans en enfants de la route protégée. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accueil' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'accueil',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'Cacitech'
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./features/permissions/permission-list.component').then((m) => m.PermissionListComponent),
        title: 'Cacitech'
      },
      {
        path: 'profils/groupes',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/profil/groupe-list/groupe-list.component').then((m) => m.GroupeListComponent),
            title: 'Cacitech'
          },
          {
            path: 'nouveau',
            loadComponent: () =>
              import('./features/profil/groupe-form/groupe-form.component').then((m) => m.GroupeFormComponent),
            title: 'Cacitech'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/profil/groupe-form/groupe-form.component').then((m) => m.GroupeFormComponent),
            title: 'Cacitech'
          }
        ]
      },
      {
        path: 'profils/nouveau',
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech'
      },
      {
        path: 'profils/:id',
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech'
      },
      {
        path: 'profils',
        loadComponent: () =>
          import('./features/profil/profil-list/profil-list.component').then((m) => m.ProfilListComponent),
        title: 'Cacitech'
      },
      {
        path: 'organigramme/fonctions',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/organigramme/fonction-list/fonction-list.component').then(
                (m) => m.FonctionListComponent
              ),
            title: 'Cacitech'
          },
          {
            path: 'nouveau',
            loadComponent: () =>
              import('./features/organigramme/fonction-form/fonction-form.component').then(
                (m) => m.FonctionFormComponent
              ),
            title: 'Cacitech'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/organigramme/fonction-form/fonction-form.component').then(
                (m) => m.FonctionFormComponent
              ),
            title: 'Cacitech'
          }
        ]
      },
      {
        path: 'organigramme/organes',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/organigramme/organe-list/organe-list.component').then((m) => m.OrganeListComponent),
            title: 'Cacitech'
          },
          {
            path: 'nouveau',
            loadComponent: () =>
              import('./features/organigramme/organe-form/organe-form.component').then((m) => m.OrganeFormComponent),
            title: 'Cacitech'
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/organigramme/organe-form/organe-form.component').then((m) => m.OrganeFormComponent),
            title: 'Cacitech'
          }
        ]
      }
    ]
  },
  { path: '**', redirectTo: 'accueil' }
];
