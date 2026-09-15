import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Page d'accueil provisoire, en attendant que de vrais écrans soient rebranchés sur l'API. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {}
