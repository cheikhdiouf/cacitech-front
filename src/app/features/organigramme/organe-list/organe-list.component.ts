import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Organe } from '../../../core/models/organigramme.models';
import { toggleActif } from '../../../core/utils/toggle-actif';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { OrganeFormComponent } from '../organe-form/organe-form.component';

interface OrganeRow {
  organe: Organe;
  tutelleLabel: string;
}

@Component({
  selector: 'app-organe-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSlideToggleModule, SearchFieldComponent],
  templateUrl: './organe-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganeListComponent implements OnInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  readonly organes = signal<Organe[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  /** Noms résolus une seule fois par chargement — évite un find() par ligne à chaque rendu. */
  readonly rows = computed<OrganeRow[]>(() => {
    const organes = this.organes();
    const namesById = new Map(organes.map((o) => [o.id, o.organe]));

    return organes.map((organe) => ({
      organe,
      tutelleLabel: organe.organe_superieure ? (namesById.get(organe.organe_superieure) ?? '—') : '—'
    }));
  });

  readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.rows();
    }
    return this.rows().filter(
      (row) => row.organe.organe.toLowerCase().includes(term) || row.organe.abreviation.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.organigrammeService.listOrganes().subscribe({
      next: (organes) => {
        this.organes.set(organes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les entités.');
        this.loading.set(false);
      }
    });
  }

  onToggleActif(id: string): void {
    const organe = this.organes().find((o) => o.id === id);
    toggleActif({
      items: this.organes,
      id,
      patch: (organeId, changes) => this.organigrammeService.patchOrgane(organeId, changes),
      notification: this.notification,
      labelActivated: 'Entité activée.',
      labelDeactivated: 'Entité désactivée.',
      dialogService: this.dialogService,
      confirmDeactivate: {
        title: 'Désactiver cette entité ?',
        message: `« ${organe?.organe ?? ''} » sera désactivée. Les fonctions et profils rattachés resteront liés mais l'entité n'apparaîtra plus comme active.`
      }
    });
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(organe: Organe): void {
    this.openDialog(organe);
  }

  private openDialog(organe: Organe | null): void {
    this.dialogService
      .open(OrganeFormComponent, { size: 'large', data: { organe } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
        }
      });
  }
}
