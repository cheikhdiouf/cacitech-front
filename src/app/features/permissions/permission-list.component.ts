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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { PermissionService } from '../../core/services/permission.service';
import { Permission } from '../../core/models/permission.models';
import { exportToExcel, exportToPdf } from '../../core/utils/table-export';
import { SearchFieldComponent } from '../../shared/components/search-field/search-field.component';
import { BreadcrumbComponent } from '../../shared/layout/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    SearchFieldComponent,
    BreadcrumbComponent
  ],
  templateUrl: './permission-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionListComponent implements OnInit, AfterViewInit {
  private readonly permissionService = inject(PermissionService);

  @ViewChild(MatSort) private readonly matSort!: MatSort;
  @ViewChild(MatPaginator) private readonly matPaginator!: MatPaginator;

  readonly displayedColumns = ['name', 'codename'];

  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly dataSource = new MatTableDataSource<Permission>([]);

  constructor() {
    effect(() => {
      this.dataSource.data = this.permissions();
    });

    this.dataSource.filterPredicate = (permission, filter) =>
      permission.name.toLowerCase().includes(filter) || permission.codename.toLowerCase().includes(filter);

    this.dataSource.sortingDataAccessor = (permission, columnId) => {
      switch (columnId) {
        case 'name':
          return permission.name.toLowerCase();
        case 'codename':
          return permission.codename.toLowerCase();
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
    this.error.set(null);
    this.permissionService.listPermissions().subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les permissions.');
        this.loading.set(false);
      }
    });
  }

  exportExcel(): void {
    exportToExcel(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (p) => p.name },
        { header: 'Code', value: (p) => p.codename }
      ],
      'permissions'
    );
  }

  exportPdf(): void {
    exportToPdf(
      this.dataSource.filteredData,
      [
        { header: 'Nom', value: (p) => p.name },
        { header: 'Code', value: (p) => p.codename }
      ],
      'permissions',
      'Permissions'
    );
  }
}
