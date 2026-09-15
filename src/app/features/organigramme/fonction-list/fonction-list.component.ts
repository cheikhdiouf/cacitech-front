import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction } from '../../../core/models/organigramme.models';
import { toggleActif } from '../../../core/utils/toggle-actif';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { FonctionFormComponent } from '../fonction-form/fonction-form.component';

@Component({
  selector: 'app-fonction-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './fonction-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionListComponent implements OnInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

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
    const fonction = this.fonctions().find((f) => f.id === id);
    toggleActif({
      items: this.fonctions,
      id,
      patch: (fonctionId, changes) => this.organigrammeService.patchFonction(fonctionId, changes),
      notification: this.notification,
      labelActivated: 'Fonction activée.',
      labelDeactivated: 'Fonction désactivée.',
      dialogService: this.dialogService,
      confirmDeactivate: {
        title: 'Désactiver cette fonction ?',
        message: `« ${fonction?.fonction ?? ''} » sera désactivée. Les profils qui l'occupent resteront liés mais elle n'apparaîtra plus comme active.`
      }
    });
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(fonction: Fonction): void {
    this.openDialog(fonction, false);
  }

  openDetail(fonction: Fonction): void {
    this.openDialog(fonction, true);
  }

  private openDialog(fonction: Fonction | null, readOnly = false): void {
    this.dialogService
      .open(FonctionFormComponent, { size: 'large', data: { fonction, readOnly } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
        }
      });
  }
}
