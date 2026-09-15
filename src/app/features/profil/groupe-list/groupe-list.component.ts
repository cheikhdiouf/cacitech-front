import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProfilService } from '../../../core/services/profil.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Groupe } from '../../../core/models/groupe.models';
import { toggleActif } from '../../../core/utils/toggle-actif';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';

@Component({
  selector: 'app-groupe-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSlideToggleModule, SearchFieldComponent],
  templateUrl: './groupe-list.component.html',
  styleUrl: './groupe-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupeListComponent implements OnInit {
  private readonly profilService = inject(ProfilService);
  private readonly notification = inject(NotificationService);

  readonly groupes = signal<Groupe[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly filteredGroupes = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.groupes();
    }
    return this.groupes().filter(
      (groupe) => groupe.nom.toLowerCase().includes(term) || groupe.description.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.profilService.listGroupes().subscribe({
      next: (groupes) => {
        this.groupes.set(groupes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les groupes.');
        this.loading.set(false);
      }
    });
  }

  onToggleActif(id: string): void {
    toggleActif({
      items: this.groupes,
      id,
      patch: (groupeId, changes) => this.profilService.patchGroupe(groupeId, changes),
      notification: this.notification,
      labelActivated: 'Groupe activé.',
      labelDeactivated: 'Groupe désactivé.'
    });
  }
}
