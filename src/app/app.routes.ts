import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

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
        canActivate: [permissionGuard(['view_permission'])],
        loadComponent: () =>
          import('./features/permissions/permission-list.component').then((m) => m.PermissionListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Permissions'] }
      },
      {
        path: 'profils/groupes',
        canActivate: [permissionGuard(['add_groupe', 'change_groupe', 'detail_groupe', 'view_groupe'])],
        loadComponent: () =>
          import('./features/profil/groupe-list/groupe-list.component').then((m) => m.GroupeListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Groupes'] }
      },
      {
        path: 'profils/nouveau',
        canActivate: [permissionGuard(['add_profil'])],
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils', 'Nouveau'] }
      },
      {
        path: 'profils/:id',
        canActivate: [permissionGuard(['change_profil', 'detail_profil'])],
        loadComponent: () =>
          import('./features/profil/profil-form/profil-form.component').then((m) => m.ProfilFormComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils', 'Modifier'] }
      },
      {
        path: 'profils',
        canActivate: [permissionGuard(['add_profil', 'change_profil', 'detail_profil', 'view_profil'])],
        loadComponent: () =>
          import('./features/profil/profil-list/profil-list.component').then((m) => m.ProfilListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Paramétrage', 'Profils'] }
      },
      {
        path: 'organigramme/fonctions',
        canActivate: [permissionGuard(['add_fonction', 'change_fonction', 'detail_fonction', 'view_fonction'])],
        loadComponent: () =>
          import('./features/organigramme/fonction-list/fonction-list.component').then(
            (m) => m.FonctionListComponent
          ),
        title: 'Cacitech',
        data: { breadcrumb: ['Organigramme', 'Fonctions'] }
      },
      {
        path: 'organigramme/organes',
        canActivate: [permissionGuard(['add_organe', 'change_organe', 'detail_organe', 'view_organe'])],
        loadComponent: () =>
          import('./features/organigramme/organe-list/organe-list.component').then((m) => m.OrganeListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Organigramme', 'Entités'] }
      },
      {
        path: 'organigramme/secteurs',
        canActivate: [
          permissionGuard(['add_secteuractivite', 'change_secteuractivite', 'detail_secteuractivite', 'view_secteuractivite'])
        ],
        loadComponent: () =>
          import('./features/organigramme/secteur-list/secteur-list.component').then((m) => m.SecteurListComponent),
        title: 'Cacitech',
        data: { breadcrumb: ['Organigramme', "Secteurs d'activité"] }
      }
    ]
  },
  { path: '**', redirectTo: 'accueil' }
];
