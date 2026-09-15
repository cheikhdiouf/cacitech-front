import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin } from 'rxjs';
import { ProfilService } from '../../../core/services/profil.service';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Profil } from '../../../core/models/profil.models';
import { toggleActif } from '../../../core/utils/toggle-actif';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';

interface ProfilRow {
  profil: Profil;
  entiteLabel: string;
  fonctionLabel: string;
}

@Component({
  selector: 'app-profil-list',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    SearchFieldComponent
  ],
  templateUrl: './profil-list.component.html',
  styleUrl: './profil-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilListComponent implements OnInit {
  private readonly profilService = inject(ProfilService);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);

  readonly profils = signal<Profil[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly search = signal('');

  private readonly organeNames = signal<Record<string, string>>({});
  private readonly fonctionNames = signal<Record<string, string>>({});

  /** Labels résolus une seule fois par chargement — le template ne fait plus de lookup par ligne. */
  readonly rows = computed<ProfilRow[]>(() => {
    const organeNames = this.organeNames();
    const fonctionNames = this.fonctionNames();

    return this.profils().map((profil) => ({
      profil,
      entiteLabel: organeNames[profil.entite] ?? '—',
      fonctionLabel: fonctionNames[profil.fonction] ?? '—'
    }));
  });

  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.rows();
    }
    return this.rows().filter(
      (row) =>
        row.profil.nom.toLowerCase().includes(term) ||
        row.profil.prenom.toLowerCase().includes(term) ||
        row.profil.email.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin([this.profilService.listProfils(), this.organigrammeService.listOrganes(), this.organigrammeService.listFonctions()]).subscribe({
      next: ([profils, organes, fonctions]) => {
        this.profils.set(profils);
        this.organeNames.set(Object.fromEntries(organes.map((o) => [o.id, o.organe])));
        this.fonctionNames.set(Object.fromEntries(fonctions.map((f) => [f.id, f.fonction])));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les profils.');
        this.loading.set(false);
      }
    });
  }

  onToggleActif(id: string): void {
    toggleActif({
      items: this.profils,
      id,
      patch: (profilId, changes) => this.profilService.patchProfil(profilId, changes),
      notification: this.notification,
      labelActivated: 'Profil activé.',
      labelDeactivated: 'Profil désactivé.'
    });
  }
}
