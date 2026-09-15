import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProfilService } from '../../../core/services/profil.service';
import { PermissionService } from '../../../core/services/permission.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permission } from '../../../core/models/permission.models';
import { Groupe } from '../../../core/models/groupe.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { DialogLoadingComponent } from '../../../shared/components/dialog-loading/dialog-loading.component';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';

export interface GroupeFormDialogData {
  groupe: Groupe | null;
}

@Component({
  selector: 'app-groupe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatDialogModule,
    TextFieldComponent,
    FormActionsComponent,
    DialogLoadingComponent,
    DialogHeaderComponent,
    FormSectionComponent
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
  private readonly dialogRef = inject(MatDialogRef<GroupeFormComponent, boolean>);
  private readonly data = inject<GroupeFormDialogData>(MAT_DIALOG_DATA);

  private readonly groupeId = this.data.groupe?.id ?? null;
  readonly isEdit = this.groupeId !== null;
  readonly title = this.isEdit ? 'Modifier le groupe' : 'Nouveau groupe';

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly permissions = signal<Permission[]>([]);

  /** Reflète les permissions cochées en O(1) — évite un includes() par ligne à chaque rendu. */
  readonly selectedPermissionIds = signal<Set<number>>(new Set(this.data.groupe?.permissions ?? []));

  readonly form = this.fb.nonNullable.group({
    nom: [this.data.groupe?.nom ?? '', [Validators.required]],
    description: [this.data.groupe?.description ?? ''],
    actif: [this.data.groupe?.actif ?? true],
    permissions: this.fb.nonNullable.control<number[]>(this.data.groupe?.permissions ?? [])
  });

  get nom() {
    return this.form.controls.nom;
  }

  ngOnInit(): void {
    this.permissionService.listPermissions().subscribe({
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

  cancel(): void {
    this.dialogRef.close(false);
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
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
