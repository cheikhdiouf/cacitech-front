import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

interface NavChild {
  label: string;
  icon?: string;
  route?: string;
  /** Affiche un intitulé de sous-groupe non cliquable juste avant cet item, pour regrouper
   * visuellement des enfants apparentés sans ajouter un 3e niveau d'accordéon. */
  groupLabel?: string;
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

  constructor(private readonly router: Router) {}

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/accueil' },
    {
      label: 'Paramétrage',
      icon: 'settings',
      children: [
        { label: 'Profils', icon: 'badge', route: '/profils', groupLabel: 'Utilisateurs' },
        { label: 'Groupes', icon: 'group', route: '/profils/groupes', groupLabel: "Contrôle d'accès" },
        { label: 'Permissions', icon: 'lock_outline', route: '/permissions' }
      ]
    },
    {
      label: 'Organigramme',
      icon: 'account_tree',
      children: [
        { label: 'Entités', icon: 'apartment', route: '/organigramme/organes' },
        { label: 'Fonctions', icon: 'work_outline', route: '/organigramme/fonctions' },
        { label: "Secteurs d'activité", icon: 'factory', route: '/organigramme/secteurs' }
      ]
    }
  ];

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
    const activeParent = this.navItems.find((item) =>
      item.children?.some((child) => child.route && url.startsWith(child.route))
    );
    if (activeParent) {
      this.expandedLabels.update((current) => new Set(current).add(activeParent.label));
    }
  }
}
