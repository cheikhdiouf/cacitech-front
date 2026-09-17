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
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';
import { CurrentUserPermissionsService } from '../../../core/services/current-user-permissions.service';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
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
import { makeFilterPredicate } from '../../../core/utils/table-filter';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';
import { OrganeFormComponent } from '../organe-form/organe-form.component';

interface OrganeRow {
  organe: Organe;
  tutelleLabel: string;
}

interface OrganeNode {
  organe: Organe;
  children: OrganeNode[];
}

@Component({
  selector: 'app-organe-list',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    HasPermissionDirective,
    MatTreeModule,
    TableSkeletonComponent,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './organe-list.component.html',
  styleUrl: './organe-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganeListComponent implements OnInit, AfterViewInit {
  private readonly organigrammeService = inject(OrganigrammeService);
  readonly permissions = inject(CurrentUserPermissionsService);
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
  readonly viewMode = signal<'table' | 'tree'>('tree');

  readonly dataSource = new MatTableDataSource<OrganeRow>([]);

  readonly treeControl = new NestedTreeControl<OrganeNode>((node) => node.children);
  readonly treeDataSource = new MatTreeNestedDataSource<OrganeNode>();
  readonly hasChild = (_: number, node: OrganeNode): boolean => node.children.length > 0;

  /** Arbre reconstruit depuis la liste plate via `organe_superieure` — racines et frères triés
   * alphabétiquement à chaque niveau, pour une hiérarchie stable et lisible plutôt que
   * l'ordre brut renvoyé par l'API. */
  readonly tree = computed<OrganeNode[]>(() => {
    const organes = this.organes();
    const byId = new Set(organes.map((o) => o.id));
    const childrenByParent = new Map<string | null, Organe[]>();

    for (const organe of organes) {
      const parentId = organe.organe_superieure && byId.has(organe.organe_superieure) ? organe.organe_superieure : null;
      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(organe);
      childrenByParent.set(parentId, siblings);
    }

    for (const siblings of childrenByParent.values()) {
      siblings.sort((a, b) => a.organe.localeCompare(b.organe));
    }

    const buildNode = (organe: Organe): OrganeNode => ({
      organe,
      children: (childrenByParent.get(organe.id) ?? []).map(buildNode)
    });

    return (childrenByParent.get(null) ?? []).map(buildNode);
  });

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

    /** Racines dépliées par défaut (premier niveau visible d'un coup), enfants repliés — un
     * organigramme complet développé d'entrée serait illisible dès qu'il dépasse quelques
     * dizaines d'entités. */
    effect(() => {
      const tree = this.tree();
      this.treeDataSource.data = tree;
      /** NestedTreeControl.expandAll()/collapseAll() itèrent sur `dataNodes` (les racines) —
       * ce n'est PAS assigné automatiquement par MatTree contrairement à ce qu'on pourrait
       * penser, sans quoi ces deux méthodes ne font rien silencieusement. */
      this.treeControl.dataNodes = tree;
      tree.forEach((node) => this.treeControl.expand(node));
    });

    this.dataSource.filterPredicate = makeFilterPredicate<OrganeRow>(
      (row) => row.organe.organe,
      (row) => row.organe.abreviation
    );

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

  setViewMode(mode: 'table' | 'tree'): void {
    this.viewMode.set(mode);
  }

  expandAll(): void {
    this.treeControl.expandAll();
  }

  collapseAll(): void {
    this.treeControl.collapseAll();
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
