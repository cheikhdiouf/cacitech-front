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
import { MatTooltipModule } from '@angular/material/tooltip';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { CurrentUserPermissionsService } from '../../../core/services/current-user-permissions.service';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction } from '../../../core/models/organigramme.models';
import { toggleActif, bulkSetActif } from '../../../core/utils/toggle-actif';
import { TableSelection } from '../../../core/utils/table-selection';
import { makeFilterPredicate } from '../../../core/utils/table-filter';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
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
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    HasPermissionDirective,
    TableSkeletonComponent,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './fonction-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionListComponent implements OnInit, AfterViewInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  readonly permissions = inject(CurrentUserPermissionsService);
  private readonly notification = inject(NotificationService);
  private readonly dialogService = inject(DialogService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['select', 'fonction', 'abreviation', 'description', 'actif', 'actions'];

  readonly selection = new TableSelection<Fonction>(
    () => this.dataSource.filteredData,
    (fonction) => fonction.fonction
  );

  readonly fonctions = signal<Fonction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly dataSource = new MatTableDataSource<Fonction>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.fonctions();
    });

    this.dataSource.filterPredicate = makeFilterPredicate<Fonction>(
      (fonction) => fonction.fonction,
      (fonction) => fonction.abreviation
    );

    this.dataSource.sortingDataAccessor = (fonction, columnId) => {
      switch (columnId) {
        case 'fonction':
          return fonction.fonction.toLowerCase();
        case 'abreviation':
          return (fonction.abreviation ?? '').toLowerCase();
        case 'description':
          return (fonction.description ?? '').toLowerCase();
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
    const ids = this.selection.selected.map((f) => f.id);
    bulkSetActif({
      ids,
      actif,
      patch: (id, changes) => this.organigrammeService.patchFonction(id, changes),
      notification: this.notification,
      dialogService: this.dialogService,
      confirmTitle: 'Désactiver ces fonctions ?',
      confirmMessage: `${ids.length} fonction(s) seront désactivées.`,
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

  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Poste', value: (f) => f.fonction },
        { header: 'Abréviation', value: (f) => f.abreviation ?? '' },
        { header: 'Description', value: (f) => f.description ?? '' },
        { header: 'Statut', value: (f) => (f.actif ? 'Actif' : 'Inactif') }
      ],
      'fonctions'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Poste', value: (f) => f.fonction },
        { header: 'Abréviation', value: (f) => f.abreviation ?? '' },
        { header: 'Description', value: (f) => f.description ?? '' },
        { header: 'Statut', value: (f) => (f.actif ? 'Actif' : 'Inactif') }
      ],
      'fonctions',
      'Fonctions'
    );
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
