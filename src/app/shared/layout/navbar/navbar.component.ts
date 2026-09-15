import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  @Output() menuToggle = new EventEmitter<void>();

  readonly user = this.authService.currentUser;

  userInitials(): string {
    const u = this.user();
    if (!u) return '';
    return u.username.slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.notification.success('Vous avez été déconnecté.');
    this.router.navigateByUrl('/auth/connexion');
  }
}
