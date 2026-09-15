import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PermissionService } from '../../core/services/permission.service';
import { Permission } from '../../core/models/permission.models';
import { SearchFieldComponent } from '../../shared/components/search-field/search-field.component';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, SearchFieldComponent],
  templateUrl: './permission-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionListComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);

  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly search = signal('');

  readonly filteredPermissions = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) {
      return this.permissions();
    }
    return this.permissions().filter(
      (permission) =>
        permission.name.toLowerCase().includes(term) || permission.codename.toLowerCase().includes(term)
    );
  });

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
}
