import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { ProfilService } from '../../../core/services/profil.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Organe } from '../../../core/models/organigramme.models';
import { Profil } from '../../../core/models/profil.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { DialogLoadingComponent } from '../../../shared/components/dialog-loading/dialog-loading.component';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';

export interface OrganeFormDialogData {
  organe: Organe | null;
}

@Component({
  selector: 'app-organe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    TextFieldComponent,
    FormActionsComponent,
    DialogLoadingComponent,
    DialogHeaderComponent,
    FormSectionComponent
  ],
  templateUrl: './organe-form.component.html',
  styleUrl: './organe-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly profilService = inject(ProfilService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<OrganeFormComponent, boolean>);
  private readonly data = inject<OrganeFormDialogData>(MAT_DIALOG_DATA);

  private readonly organeId = this.data.organe?.id ?? null;
  readonly isEdit = this.organeId !== null;
  readonly title = this.isEdit ? "Modifier l'entité" : 'Nouvelle entité';

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly organesDisponibles = signal<Organe[]>([]);
  readonly profils = signal<Profil[]>([]);

  readonly form = this.fb.nonNullable.group({
    organe: [this.data.organe?.organe ?? '', [Validators.required]],
    abreviation: [this.data.organe?.abreviation ?? '', [Validators.required]],
    organe_superieure: [this.data.organe?.organe_superieure ?? ''],
    responsable: [this.data.organe?.responsable ?? ''],
    actif: [this.data.organe?.actif ?? true]
  });

  get organe() {
    return this.form.controls.organe;
  }

  get abreviation() {
    return this.form.controls.abreviation;
  }

  ngOnInit(): void {
    forkJoin([this.organigrammeService.listOrganes(), this.profilService.listProfils()]).subscribe({
      next: ([organes, profils]) => {
        this.organesDisponibles.set(organes.filter((o) => o.id !== this.organeId));
        this.profils.set(profils);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Impossible de charger les données de référence.');
        this.loading.set(false);
      }
    });
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
    const raw = this.form.getRawValue();
    const payload = {
      organe: raw.organe,
      abreviation: raw.abreviation,
      organe_superieure: raw.organe_superieure || null,
      responsable: raw.responsable || null,
      actif: raw.actif
    };

    const request$ = this.isEdit
      ? this.organigrammeService.updateOrgane(this.organeId!, payload)
      : this.organigrammeService.createOrgane(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success(this.isEdit ? 'Entité mise à jour.' : 'Entité créée.');
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
