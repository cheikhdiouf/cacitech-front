import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/** Barre de recherche instantanée réutilisable pour les écrans de liste (filtrage client). */
@Component({
  selector: 'app-search-field',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchFieldComponent {
  @Input() placeholder = 'Rechercher...';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  clear(): void {
    this.valueChange.emit('');
  }
}
