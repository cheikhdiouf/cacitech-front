import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { CurrentUserPermissionsService } from '../../../core/services/current-user-permissions.service';

interface NavChild {
  label: string;
  icon?: string;
  route?: string;
  /** Affiche un intitulé de sous-groupe non cliquable juste avant cet item, pour regrouper
   * visuellement des enfants apparentés sans ajouter un 3e niveau d'accordéon. */
  groupLabel?: string;
  /** Visible si l'utilisateur possède AU MOINS un de ces codenames — absent = toujours visible. */
  permissions?: string[];
}

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavChild[];
  /** Module pas encore implémenté (aucune route derrière ses enfants) — affiché grisé et non cliquable. */
  disabled?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  private readonly permissions = inject(CurrentUserPermissionsService);

  constructor(private readonly router: Router) {}

  private readonly allNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/accueil' },
    {
      label: 'Paramétrage',
      icon: 'settings',
      children: [
        {
          label: 'Profils',
          icon: 'badge',
          route: '/profils',
          groupLabel: 'Utilisateurs',
          permissions: ['add_profil', 'change_profil', 'detail_profil', 'view_profil']
        },
        {
          label: 'Groupes',
          icon: 'group',
          route: '/profils/groupes',
          groupLabel: "Contrôle d'accès",
          permissions: ['add_groupe', 'change_groupe', 'detail_groupe', 'view_groupe']
        },
        { label: 'Permissions', icon: 'lock_outline', route: '/permissions', permissions: ['view_permission'] }
      ]
    },
    {
      label: 'Organigramme',
      icon: 'account_tree',
      children: [
        {
          label: 'Entités',
          icon: 'apartment',
          route: '/organigramme/organes',
          permissions: ['add_organe', 'change_organe', 'detail_organe', 'view_organe']
        },
        {
          label: 'Fonctions',
          icon: 'work_outline',
          route: '/organigramme/fonctions',
          permissions: ['add_fonction', 'change_fonction', 'detail_fonction', 'view_fonction']
        },
        {
          label: "Secteurs d'activité",
          icon: 'factory',
          route: '/organigramme/secteurs',
          permissions: ['add_secteuractivite', 'change_secteuractivite', 'detail_secteuractivite', 'view_secteuractivite']
        }
      ]
    }
  ];

  /** Filtre le menu selon les permissions de l'utilisateur connecté : un enfant sans
   * `permissions` déclarées reste toujours visible, un parent disparaît si plus aucun de ses
   * enfants ne l'est. Recalculé automatiquement dès que les permissions sont chargées. */
  readonly navItems = computed<NavItem[]>(() =>
    this.allNavItems
      .map((item) => {
        if (!item.children) {
          return item;
        }
        const visibleChildren = item.children.filter(
          (child) => !child.permissions || child.permissions.some((codename) => this.permissions.has(codename))
        );
        return { ...item, children: visibleChildren };
      })
      .filter((item) => !item.children || item.children.length > 0)
  );

  private readonly expandedLabels = signal(new Set<string>());

  ngOnInit(): void {
    this.expandActiveParent(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.expandActiveParent(event.urlAfterRedirects));
  }

  isExpanded(item: NavItem): boolean {
    return this.expandedLabels().has(item.label);
  }

  hasActiveChild(item: NavItem): boolean {
    return !!item.children?.some((child) => child.route && this.router.url.startsWith(child.route));
  }

  toggle(item: NavItem): void {
    if (!item.children || item.disabled) {
      return;
    }

    /** Sous-menu invisible en mode icônes seules : on déplie d'abord la sidebar
     * pour que l'utilisateur puisse effectivement atteindre les enfants. */
    if (this.collapsed) {
      this.toggleCollapse.emit();
    }

    this.expandedLabels.update((current) => {
      const next = new Set(current);
      if (next.has(item.label)) {
        next.delete(item.label);
      } else {
        next.add(item.label);
      }
      return next;
    });
  }

  private expandActiveParent(url: string): void {
    const activeParent = this.navItems().find((item) =>
      item.children?.some((child) => child.route && url.startsWith(child.route))
    );
    if (activeParent) {
      this.expandedLabels.update((current) => new Set(current).add(activeParent.label));
    }
  }
}
