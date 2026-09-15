import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { ProfilService } from '../../core/services/profil.service';
import { OrganigrammeService } from '../../core/services/organigramme.service';
import { PermissionService } from '../../core/services/permission.service';

interface KpiCard {
  label: string;
  total: number;
  actif: number;
  icon: string;
  route: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nouveau profil', icon: 'person_add', route: '/profils/nouveau' },
  { label: 'Nouvelle entité', icon: 'apartment', route: '/organigramme/organes' },
  { label: 'Nouveau groupe', icon: 'group_add', route: '/profils/groupes' },
  { label: 'Nouvelle fonction', icon: 'work_outline', route: '/organigramme/fonctions' }
];

/** Tableau de bord : indicateurs clés + raccourcis vers les actions de création les plus
 * fréquentes, pour limiter le nombre de clics nécessaires depuis l'accueil. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly profilService = inject(ProfilService);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly permissionService = inject(PermissionService);

  readonly quickActions = QUICK_ACTIONS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly kpis = signal<KpiCard[]>([]);

  readonly username = computed(() => this.authService.currentUser()?.username ?? '');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      profils: this.profilService.listProfils(),
      groupes: this.profilService.listGroupes(),
      organes: this.organigrammeService.listOrganes(),
      fonctions: this.organigrammeService.listFonctions(),
      permissions: this.permissionService.listPermissions()
    }).subscribe({
      next: ({ profils, groupes, organes, fonctions, permissions }) => {
        this.kpis.set([
          {
            label: 'Profils',
            total: profils.length,
            actif: profils.filter((p) => p.actif).length,
            icon: 'badge',
            route: '/profils'
          },
          {
            label: 'Entités',
            total: organes.length,
            actif: organes.filter((o) => o.actif).length,
            icon: 'apartment',
            route: '/organigramme/organes'
          },
          {
            label: 'Fonctions',
            total: fonctions.length,
            actif: fonctions.filter((f) => f.actif).length,
            icon: 'work_outline',
            route: '/organigramme/fonctions'
          },
          {
            label: 'Groupes',
            total: groupes.length,
            actif: groupes.filter((g) => g.actif).length,
            icon: 'group',
            route: '/profils/groupes'
          },
          {
            label: 'Permissions',
            total: permissions.length,
            actif: permissions.length,
            icon: 'lock_outline',
            route: '/permissions'
          }
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le tableau de bord.');
        this.loading.set(false);
      }
    });
  }
}
