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
import { ProfilService } from '../../../core/services/profil.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Groupe } from '../../../core/models/groupe.models';
import { toggleActif, bulkSetActif } from '../../../core/utils/toggle-actif';
import { TableSelection } from '../../../core/utils/table-selection';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { GroupeFormComponent } from '../groupe-form/groupe-form.component';

@Component({
  selector: 'app-groupe-list',
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
  templateUrl: './groupe-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupeListComponent implements OnInit, AfterViewInit {
  private readonly profilService = inject(ProfilService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['select', 'nom', 'description', 'permissions', 'actif', 'actions'];

  readonly selection = new TableSelection<Groupe>(
    () => this.dataSource.filteredData,
    (groupe) => groupe.nom
  );

  readonly groupes = signal<Groupe[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly dataSource = new MatTableDataSource<Groupe>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.groupes();
    });

    this.dataSource.filterPredicate = (groupe, filter) =>
      groupe.nom.toLowerCase().includes(filter) || groupe.description.toLowerCase().includes(filter);

    this.dataSource.sortingDataAccessor = (groupe, columnId) => {
      switch (columnId) {
        case 'nom':
          return groupe.nom.toLowerCase();
        case 'description':
          return groupe.description.toLowerCase();
        case 'permissions':
          return groupe.permissions.length;
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
    const ids = this.selection.selected.map((g) => g.id);
    bulkSetActif({
      ids,
      actif,
      patch: (id, changes) => this.profilService.patchGroupe(id, changes),
      notification: this.notification,
      dialogService: this.dialogService,
      confirmTitle: 'Désactiver ces groupes ?',
      confirmMessage: `${ids.length} groupe(s) seront désactivés.`,
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
    const groupe = this.groupes().find((g) => g.id === id);
    toggleActif({
      items: this.groupes,
      id,
      patch: (groupeId, changes) => this.profilService.patchGroupe(groupeId, changes),
      notification: this.notification,
      labelActivated: 'Groupe activé.',
      labelDeactivated: 'Groupe désactivé.',
      dialogService: this.dialogService,
      confirmDeactivate: {
        title: 'Désactiver ce groupe ?',
        message: `« ${groupe?.nom ?? ''} » sera désactivé. Les utilisateurs de ce groupe perdront les permissions associées.`
      }
    });
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(groupe: Groupe): void {
    this.openDialog(groupe, false);
  }

  openDetail(groupe: Groupe): void {
    this.openDialog(groupe, true);
  }

  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (g) => g.nom },
        { header: 'Description', value: (g) => g.description },
        { header: 'Permissions', value: (g) => g.permissions.length },
        { header: 'Statut', value: (g) => (g.actif ? 'Actif' : 'Inactif') }
      ],
      'groupes'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (g) => g.nom },
        { header: 'Description', value: (g) => g.description },
        { header: 'Permissions', value: (g) => g.permissions.length },
        { header: 'Statut', value: (g) => (g.actif ? 'Actif' : 'Inactif') }
      ],
      'groupes',
      'Groupes'
    );
  }

  private openDialog(groupe: Groupe | null, readOnly = false): void {
    this.dialogService
      .open(GroupeFormComponent, { size: 'large', data: { groupe, readOnly } })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.load();
        }
      });
  }
}
