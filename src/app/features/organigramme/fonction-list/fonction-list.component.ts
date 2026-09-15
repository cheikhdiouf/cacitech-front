import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction } from '../../../core/models/organigramme.models';
import { toggleActif } from '../../../core/utils/toggle-actif';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';

@Component({
  selector: 'app-fonction-list',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    SearchFieldComponent
  ],
  templateUrl: './fonction-list.component.html',
  styleUrl: './fonction-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionListComponent implements OnInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);

  readonly fonctions = signal<Fonction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly filteredFonctions = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.fonctions();
    }
    return this.fonctions().filter(
      (fonction) =>
        fonction.fonction.toLowerCase().includes(term) ||
        (fonction.abreviation ?? '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.organigrammeService.listFonctions().subscribe({
      next: (fonctions) => {
        this.fonctions.set(fonctions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les fonctions.');
        this.loading.set(false);
      }
    });
  }

  onToggleActif(id: string): void {
    toggleActif({
      items: this.fonctions,
      id,
      patch: (fonctionId, changes) => this.organigrammeService.patchFonction(fonctionId, changes),
      notification: this.notification,
      labelActivated: 'Fonction activée.',
      labelDeactivated: 'Fonction désactivée.'
    });
  }
}
