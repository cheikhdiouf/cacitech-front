import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { ProfilService } from '../../../core/services/profil.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permission } from '../../../core/models/permission.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';

@Component({
  selector: 'app-groupe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TextFieldComponent
  ],
  templateUrl: './groupe-form.component.html',
  styleUrl: './groupe-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profilService = inject(ProfilService);
  private readonly permissionService = inject(PermissionService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly groupeId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.groupeId !== null;

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly permissions = signal<Permission[]>([]);

  /** Reflète les permissions cochées en O(1) — évite un includes() par ligne à chaque rendu. */
  readonly selectedPermissionIds = signal<Set<number>>(new Set());

  readonly form = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    description: [''],
    actif: [true],
    permissions: this.fb.nonNullable.control<number[]>([])
  });

  get nom() {
    return this.form.controls.nom;
  }

  ngOnInit(): void {
    const permissions$ = this.permissionService.listPermissions();

    if (this.isEdit) {
      forkJoin([permissions$, this.profilService.detailGroupe(this.groupeId!)]).subscribe({
        next: ([permissions, groupe]) => {
          this.permissions.set(permissions);
          this.form.patchValue({
            nom: groupe.nom,
            description: groupe.description,
            actif: groupe.actif,
            permissions: groupe.permissions
          });
          this.selectedPermissionIds.set(new Set(groupe.permissions));
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Impossible de charger le groupe.');
          this.loading.set(false);
        }
      });
    } else {
      permissions$.subscribe({
        next: (permissions) => {
          this.permissions.set(permissions);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Impossible de charger les permissions.');
          this.loading.set(false);
        }
      });
    }
  }

  isPermissionSelected(id: number): boolean {
    return this.selectedPermissionIds().has(id);
  }

  togglePermission(id: number, checked: boolean): void {
    const next = new Set(this.selectedPermissionIds());
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.selectedPermissionIds.set(next);
    this.form.controls.permissions.setValue(Array.from(next));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = this.form.getRawValue();

    const request$ = this.isEdit
      ? this.profilService.updateGroupe(this.groupeId!, payload)
      : this.profilService.createGroupe(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success(this.isEdit ? 'Groupe mis à jour.' : 'Groupe créé.');
        this.router.navigate(['/profils/groupes']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
