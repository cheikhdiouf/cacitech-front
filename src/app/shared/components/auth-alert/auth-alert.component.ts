import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type AuthAlertType = 'error' | 'success';

/** Bannière de retour utilisateur (erreur ou succès) pour les écrans d'authentification. */
@Component({
  selector: 'app-auth-alert',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './auth-alert.component.html',
  styleUrl: './auth-alert.component.css'
})
export class AuthAlertComponent {
  @Input({ required: true }) type!: AuthAlertType;
  @Input({ required: true }) message!: string;
}
