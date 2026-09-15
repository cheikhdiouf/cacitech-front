import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Enveloppe visuelle commune aux écrans d'authentification (login...) : carte centrée. */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent {}
