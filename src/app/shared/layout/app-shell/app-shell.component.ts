import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CurrentUserPermissionsService } from '../../../core/services/current-user-permissions.service';

const SIDEBAR_COLLAPSED_KEY = 'cicatech.sidebar.collapsed';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css'
})
export class AppShellComponent {
  constructor() {
    /** app-shell enveloppe toutes les routes protégées et n'est instancié qu'une fois par
     * session connectée — point d'entrée naturel pour charger les permissions de l'utilisateur
     * une seule fois (load() est idempotent). */
    inject(CurrentUserPermissionsService).load();
  }

  /** Mode icônes seules sur desktop, choix persistant de l'utilisateur. */
  readonly sidebarCollapsed = signal(this.restoreCollapsedState());
  /** Panneau hors-écran ouvert/fermé sur mobile, jamais persisté. */
  readonly mobileNavOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  private restoreCollapsedState(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  }
}
