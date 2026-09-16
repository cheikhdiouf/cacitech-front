import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { DetailFieldComponent } from '../../../shared/components/detail-field/detail-field.component';

export interface GroupeFormDialogData {
  groupe: Groupe | null;
  readOnly?: boolean;
}

@Component({
  selector: 'app-groupe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    TextFieldComponent,
    FormActionsComponent,
    DialogLoadingComponent,
    DialogHeaderComponent,
    FormSectionComponent,
    DetailFieldComponent
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
  readonly readOnly = this.data.readOnly ?? false;
  readonly title = this.readOnly ? 'Détails du groupe' : this.isEdit ? 'Modifier le groupe' : 'Nouveau groupe';

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly permissions = signal<Permission[]>([]);

  /** Reflète les permissions cochées en O(1) — évite un includes() par ligne à chaque rendu. */
  readonly selectedPermissionIds = signal<Set<number>>(new Set(this.data.groupe?.permissions ?? []));
  readonly detailView = signal<Groupe | null>(this.data.groupe);

  readonly selectedPermissionNames = computed(() =>
    this.permissions()
      .filter((p) => this.selectedPermissionIds().has(p.id))
      .map((p) => p.name)
  );

  readonly form = this.fb.nonNullable.group({
    nom: [this.data.groupe?.nom ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.data.groupe?.description ?? ''],
    actif: [this.data.groupe?.actif ?? true],
    permissions: this.fb.nonNullable.control<number[]>(this.data.groupe?.permissions ?? [])
  });

  get nom() {
    return this.form.controls.nom;
  }

  ngOnInit(): void {
    if (this.readOnly) {
      this.form.disable();
    }

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

    /** Ne bloque pas l'ouverture de la popup : affiche d'abord la ligne cliquée (déjà dans
     * `data.groupe`), puis repatch silencieusement si l'API renvoie une version plus fraîche. */
    if (this.groupeId) {
      this.profilService.detailGroupe(this.groupeId).subscribe((groupe) => {
        this.form.patchValue({
          nom: groupe.nom,
          description: groupe.description,
          actif: groupe.actif,
          permissions: groupe.permissions
        });
        this.selectedPermissionIds.set(new Set(groupe.permissions));
        this.detailView.set(groupe);
      });
    }
  }

  isPermissionSelected(id: number): boolean {
    return this.selectedPermissionIds().has(id);
  }

  togglePermission(id: number, checked: boolean): void {
    if (this.readOnly) {
      return;
    }

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
