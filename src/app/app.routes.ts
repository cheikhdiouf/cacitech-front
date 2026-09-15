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
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Permissions'] }
      },
      {
        path: 'profils/groupes',
        loadComponent: () =>
          import('./features/profil/groupe-list/groupe-list.component').then((m) => m.GroupeListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Groupes'] }
      },
      {
        path: 'profils/nouveau',
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils', 'Nouveau'] }
      },
      {
        path: 'profils/:id',
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils', 'Modifier'] }
      },
      {
        path: 'profils',
        loadComponent: () =>
          import('./features/profil/profil-list/profil-list.component').then((m) => m.ProfilListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils'] }
      },
      {
        path: 'organigramme/fonctions',
        loadComponent: () =>
          import('./features/organigramme/fonction-list/fonction-list.component').then(
            (m) => m.FonctionListComponent
          ),
        title: 'Cacitech',
        data: { breadcrumb: ['Organigramme', 'Fonctions'] }
      },
      {
        path: 'organigramme/organes',
        loadComponent: () =>
          import('./features/organigramme/organe-list/organe-list.component').then((m) => m.OrganeListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Organigramme', 'Entités'] }
      }
    ]
  },
  { path: '**', redirectTo: 'accueil' }
];
