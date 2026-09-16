import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Organe } from '../../../core/models/organigramme.models';
import { toggleActif, bulkSetActif } from '../../../core/utils/toggle-actif';
import { TableSelection } from '../../../core/utils/table-selection';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { OrganeFormComponent } from '../organe-form/organe-form.component';

interface OrganeRow {
  organe: Organe;
  tutelleLabel: string;
}

@Component({
  selector: 'app-organe-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    TableSkeletonComponent,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './organe-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganeListComponent implements OnInit, AfterViewInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['select', 'organe', 'abreviation', 'tutelle', 'niveau', 'actif', 'actions'];

  readonly selection = new TableSelection<OrganeRow>(
    () => this.dataSource.filteredData,
    (row) => row.organe.organe
  );

  readonly organes = signal<Organe[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly dataSource = new MatTableDataSource<OrganeRow>([]);

  /** Noms résolus une seule fois par chargement — évite un find() par ligne à chaque rendu. */
  readonly rows = computed<OrganeRow[]>(() => {
    const organes = this.organes();
    const namesById = new Map(organes.map((o) => [o.id, o.organe]));

    return organes.map((organe) => ({
      organe,
      tutelleLabel: organe.organe_superieure ? (namesById.get(organe.organe_superieure) ?? '—') : '—'
    }));
  });

  constructor() {
    /** Synchronise le dataSource MatTable (filtrage/tri/pagination natifs Material) avec les
     * lignes calculées à partir des signaux — le dataSource reste la seule source de vérité
     * pour le template, on ne gère plus de filtrage/tri manuel côté composant. */
    effect(() => {
      this.dataSource.data = this.rows();
    });

    this.dataSource.filterPredicate = (row, filter) =>
      row.organe.organe.toLowerCase().includes(filter) || row.organe.abreviation.toLowerCase().includes(filter);

    this.dataSource.sortingDataAccessor = (row, columnId) => {
      switch (columnId) {
        case 'organe':
          return row.organe.organe.toLowerCase();
        case 'abreviation':
          return row.organe.abreviation.toLowerCase();
        case 'tutelle':
          return row.tutelleLabel.toLowerCase();
        case 'niveau':
          return row.organe.niveau;
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
    const ids = this.selection.selected.map((row) => row.organe.id);
    bulkSetActif({
      ids,
      actif,
      patch: (id, changes) => this.organigrammeService.patchOrgane(id, changes),
      notification: this.notification,
      dialogService: this.dialogService,
      confirmTitle: 'Désactiver ces entités ?',
      confirmMessage: `${ids.length} entité(s) seront désactivées.`,
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
    this.openDialog(organe, false);
  }

  openDetail(organe: Organe): void {
    this.openDialog(organe, true);
  }

  /** Exporte les lignes actuellement filtrées/triées (dataSource.filteredData), pas la page
   * seule affichée — l'utilisateur exporte "sa recherche", pas juste 5-10 lignes visibles. */
  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Entité', value: (row) => row.organe.organe },
        { header: 'Abréviation', value: (row) => row.organe.abreviation },
        { header: 'Tutelle', value: (row) => row.tutelleLabel },
        { header: 'Niveau', value: (row) => row.organe.niveau },
        { header: 'Statut', value: (row) => (row.organe.actif ? 'Actif' : 'Inactif') }
      ],
      'entites'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Entité', value: (row) => row.organe.organe },
        { header: 'Abréviation', value: (row) => row.organe.abreviation },
        { header: 'Tutelle', value: (row) => row.tutelleLabel },
        { header: 'Niveau', value: (row) => row.organe.niveau },
        { header: 'Statut', value: (row) => (row.organe.actif ? 'Actif' : 'Inactif') }
      ],
      'entites',
      'Entités'
    );
  }

  private openDialog(organe: Organe | null, readOnly = false): void {
    this.dialogService
      .open(OrganeFormComponent, { size: 'large', data: { organe, readOnly } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
        }
      });
  }
}
