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
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import { ProfilService } from '../../../core/services/profil.service';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Profil } from '../../../core/models/profil.models';
import { toggleActif, bulkSetActif } from '../../../core/utils/toggle-actif';
import { TableSelection } from '../../../core/utils/table-selection';
import { exportToExcel, exportToPdf } from '../../../core/utils/table-export';
import { SearchFieldComponent } from '../../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { DialogService } from '../../../shared/services/dialog.service';

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
    MatCheckboxModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './profil-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilListComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly profilService = inject(ProfilService);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['select', 'nom', 'prenom', 'email', 'entite', 'fonction', 'actif', 'actions'];

  readonly selection = new TableSelection<ProfilRow>(
    () => this.dataSource.filteredData,
    (row) => `${row.profil.nom} ${row.profil.prenom}`
  );

  readonly profils = signal<Profil[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  private readonly organeNames = signal<Record<string, string>>({});
  private readonly fonctionNames = signal<Record<string, string>>({});

  readonly dataSource = new MatTableDataSource<ProfilRow>([]);

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

  constructor() {
    effect(() => {
      this.dataSource.data = this.rows();
    });

    this.dataSource.filterPredicate = (row, filter) =>
      row.profil.nom.toLowerCase().includes(filter) ||
      row.profil.prenom.toLowerCase().includes(filter) ||
      row.profil.email.toLowerCase().includes(filter);

    this.dataSource.sortingDataAccessor = (row, columnId) => {
      switch (columnId) {
        case 'nom':
          return row.profil.nom.toLowerCase();
        case 'prenom':
          return row.profil.prenom.toLowerCase();
        case 'email':
          return row.profil.email.toLowerCase();
        case 'entite':
          return row.entiteLabel.toLowerCase();
        case 'fonction':
          return row.fonctionLabel.toLowerCase();
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

  openEdit(id: string): void {
    this.router.navigate(['/profils', id]);
  }

  bulkActivate(): void {
    this.runBulkSetActif(true);
  }

  bulkDeactivate(): void {
    this.runBulkSetActif(false);
  }

  private runBulkSetActif(actif: boolean): void {
    const ids = this.selection.selected.map((row) => row.profil.id);
    bulkSetActif({
      ids,
      actif,
      patch: (id, changes) => this.profilService.patchProfil(id, changes),
      notification: this.notification,
      dialogService: this.dialogService,
      confirmTitle: 'Désactiver ces profils ?',
      confirmMessage: `${ids.length} profil(s) ne pourront plus se connecter à l'application.`,
      onDone: () => {
        this.selection.clear();
        this.load();
      }
    });
  }

  onToggleActif(id: string): void {
    const profil = this.profils().find((p) => p.id === id);
    toggleActif({
      items: this.profils,
      id,
      patch: (profilId, changes) => this.profilService.patchProfil(profilId, changes),
      notification: this.notification,
      labelActivated: 'Profil activé.',
      labelDeactivated: 'Profil désactivé.',
      dialogService: this.dialogService,
      confirmDeactivate: {
        title: 'Désactiver cet utilisateur ?',
        message: `« ${profil?.prenom ?? ''} ${profil?.nom ?? ''} » ne pourra plus se connecter à l'application.`
      }
    });
  }

  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (row) => row.profil.nom },
        { header: 'Prénom', value: (row) => row.profil.prenom },
        { header: 'Email', value: (row) => row.profil.email },
        { header: 'Entité', value: (row) => row.entiteLabel },
        { header: 'Fonction', value: (row) => row.fonctionLabel },
        { header: 'Statut', value: (row) => (row.profil.actif ? 'Actif' : 'Inactif') }
      ],
      'profils'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (row) => row.profil.nom },
        { header: 'Prénom', value: (row) => row.profil.prenom },
        { header: 'Email', value: (row) => row.profil.email },
        { header: 'Entité', value: (row) => row.entiteLabel },
        { header: 'Fonction', value: (row) => row.fonctionLabel },
        { header: 'Statut', value: (row) => (row.profil.actif ? 'Actif' : 'Inactif') }
      ],
      'profils',
      'Profils'
    );
  }
}
