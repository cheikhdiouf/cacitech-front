import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
import { DetailFieldComponent } from '../../../shared/components/detail-field/detail-field.component';

export interface OrganeFormDialogData {
  organe: Organe | null;
  /** Popup en lecture seule (icône "œil" des listes) : formulaire désactivé, un seul bouton
   * "Fermer" à la place d'Annuler/Enregistrer. */
  readOnly?: boolean;
}

@Component({
  selector: 'app-organe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
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
  readonly readOnly = this.data.readOnly ?? false;
  readonly title = this.readOnly ? "Détails de l'entité" : this.isEdit ? "Modifier l'entité" : 'Nouvelle entité';

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly organesDisponibles = signal<Organe[]>([]);
  readonly profils = signal<Profil[]>([]);
  readonly detailView = signal<Organe | null>(this.data.organe);

  readonly tutelleLabel = computed(() => {
    const tutelleId = this.detailView()?.organe_superieure;
    if (!tutelleId) {
      return 'Aucune';
    }
    return this.organesDisponibles().find((o) => o.id === tutelleId)?.organe ?? '—';
  });

  readonly responsableLabel = computed(() => {
    const responsableId = this.detailView()?.responsable;
    if (!responsableId) {
      return 'Aucun';
    }
    const profil = this.profils().find((p) => p.id === responsableId);
    return profil ? `${profil.prenom} ${profil.nom}` : '—';
  });

  readonly form = this.fb.nonNullable.group({
    organe: [this.data.organe?.organe ?? '', [Validators.required, Validators.maxLength(400)]],
    abreviation: [this.data.organe?.abreviation ?? '', [Validators.required, Validators.maxLength(15)]],
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
    if (this.readOnly) {
      this.form.disable();
    }

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

    /** Ne bloque pas l'ouverture de la popup : affiche d'abord la ligne cliquée (déjà dans
     * `data.organe`), puis repatch silencieusement si l'API renvoie une version plus fraîche. */
    if (this.organeId) {
      this.organigrammeService.detailOrgane(this.organeId).subscribe((organe) => {
        this.form.patchValue({
          organe: organe.organe,
          abreviation: organe.abreviation,
          organe_superieure: organe.organe_superieure ?? '',
          responsable: organe.responsable ?? '',
          actif: organe.actif
        });
        this.detailView.set(organe);
      });
    }
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
