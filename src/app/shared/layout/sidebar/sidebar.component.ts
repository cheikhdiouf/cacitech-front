import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/accueil' },
    { label: 'Permissions', icon: 'lock_outline', route: '/permissions' },
    {
      label: 'Profils',
      icon: 'badge',
      children: [
        { label: 'Profils', icon: 'badge', route: '/profils' },
        { label: 'Groupes', icon: 'group', route: '/profils/groupes' }
      ]
    },
    {
      label: 'Organigramme',
      icon: 'account_tree',
      children: [
        { label: 'Entités', icon: 'apartment', route: '/organigramme/organes' },
        { label: 'Fonctions', icon: 'work_outline', route: '/organigramme/fonctions' }
      ]
    }
  ];

  private readonly expandedLabels = signal(new Set<string>());

  isExpanded(item: NavItem): boolean {
    return this.expandedLabels().has(item.label);
  }

  toggle(item: NavItem): void {
    if (!item.children || item.disabled) {
      return;
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
}
