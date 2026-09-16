import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { ParametrageService } from '../../../core/services/parametrage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SecteurActivite } from '../../../core/models/parametrage.models';
import { toggleActif, bulkSetActif } from '../../../core/utils/toggle-actif';
import { TableSelection } from '../../../core/utils/table-selection';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { SecteurFormComponent } from '../secteur-form/secteur-form.component';

@Component({
  selector: 'app-secteur-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    TableSkeletonComponent,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './secteur-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecteurListComponent implements OnInit, AfterViewInit {
  private readonly parametrageService = inject(ParametrageService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['select', 'libelle', 'description', 'actif', 'actions'];

  readonly selection = new TableSelection<SecteurActivite>(
    () => this.dataSource.filteredData,
    (secteur) => secteur.libelle
  );

  readonly secteurs = signal<SecteurActivite[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly dataSource = new MatTableDataSource<SecteurActivite>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.secteurs();
    });

    this.dataSource.filterPredicate = (secteur, filter) =>
      secteur.libelle.toLowerCase().includes(filter) || (secteur.description ?? '').toLowerCase().includes(filter);

    this.dataSource.sortingDataAccessor = (secteur, columnId) => {
      switch (columnId) {
        case 'libelle':
          return secteur.libelle.toLowerCase();
        case 'description':
          return (secteur.description ?? '').toLowerCase();
        default:
          return '';
      }
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.matSort;
    this.dataSource.paginator = this.matPaginator;
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  bulkActivate(): void {
    this.runBulkSetActif(true);
  }

  bulkDeactivate(): void {
    this.runBulkSetActif(false);
  }

  private runBulkSetActif(actif: boolean): void {
    const ids = this.selection.selected.map((s) => s.id);
    bulkSetActif({
      ids,
      actif,
      patch: (id, changes) => this.parametrageService.patchSecteurActivite(id, changes),
      notification: this.notification,
      dialogService: this.dialogService,
      confirmTitle: 'Désactiver ces secteurs ?',
      confirmMessage: `${ids.length} secteur(s) seront désactivés.`,
      onDone: () => {
        this.selection.clear();
        this.load();
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.parametrageService.listSecteursActivite().subscribe({
      next: (secteurs) => {
        this.secteurs.set(secteurs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Impossible de charger les secteurs d'activité.");
        this.loading.set(false);
      }
    });
  }

  onToggleActif(id: string): void {
    const secteur = this.secteurs().find((s) => s.id === id);
    toggleActif({
      items: this.secteurs,
      id,
      patch: (secteurId, changes) => this.parametrageService.patchSecteurActivite(secteurId, changes),
      notification: this.notification,
      labelActivated: 'Secteur activé.',
      labelDeactivated: 'Secteur désactivé.',
      dialogService: this.dialogService,
      confirmDeactivate: {
        title: 'Désactiver ce secteur ?',
        message: `« ${secteur?.libelle ?? ''} » sera désactivé.`
      }
    });
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(secteur: SecteurActivite): void {
    this.openDialog(secteur, false);
  }

  openDetail(secteur: SecteurActivite): void {
    this.openDialog(secteur, true);
  }

  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Libellé', value: (s) => s.libelle },
        { header: 'Description', value: (s) => s.description ?? '' },
        { header: 'Statut', value: (s) => (s.actif ? 'Actif' : 'Inactif') }
      ],
      'secteurs-activite'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Libellé', value: (s) => s.libelle },
        { header: 'Description', value: (s) => s.description ?? '' },
        { header: 'Statut', value: (s) => (s.actif ? 'Actif' : 'Inactif') }
      ],
      'secteurs-activite',
      "Secteurs d'activité"
    );
  }

  private openDialog(secteur: SecteurActivite | null, readOnly = false): void {
    this.dialogService
      .open(SecteurFormComponent, { size: 'large', data: { secteur, readOnly } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
        }
      });
  }
}
