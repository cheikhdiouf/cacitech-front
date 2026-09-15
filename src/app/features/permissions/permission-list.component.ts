import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PermissionService } from '../../core/services/permission.service';
import { Permission } from '../../core/models/permission.models';

@Component({
  selector: 'app-permission-list',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './permission-list.component.html',
  styleUrl: './permission-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionListComponent implements OnInit {
  private readonly permissionService = inject(PermissionService);

  readonly permissions = signal<Permission[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
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
