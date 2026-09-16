import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParametrageService } from '../../../core/services/parametrage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SecteurActivite } from '../../../core/models/parametrage.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { DetailFieldComponent } from '../../../shared/components/detail-field/detail-field.component';

export interface SecteurFormDialogData {
  secteur: SecteurActivite | null;
  readOnly?: boolean;
}

@Component({
  selector: 'app-secteur-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    TextFieldComponent,
    FormActionsComponent,
    DialogHeaderComponent,
    FormSectionComponent,
    DetailFieldComponent
  ],
  templateUrl: './secteur-form.component.html',
  styleUrl: './secteur-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecteurFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly parametrageService = inject(ParametrageService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<SecteurFormComponent, boolean>);
  private readonly data = inject<SecteurFormDialogData>(MAT_DIALOG_DATA);

  private readonly secteurId = this.data.secteur?.id ?? null;
  readonly isEdit = this.secteurId !== null;
  readonly readOnly = this.data.readOnly ?? false;
  readonly title = this.readOnly
    ? "Détails du secteur d'activité"
    : this.isEdit
      ? "Modifier le secteur d'activité"
      : "Nouveau secteur d'activité";

  readonly isSubmitting = signal(false);
  readonly detailView = signal<SecteurActivite | null>(this.data.secteur);

  readonly form = this.fb.nonNullable.group({
    libelle: [this.data.secteur?.libelle ?? '', [Validators.required, Validators.maxLength(150)]],
    description: [this.data.secteur?.description ?? '', [Validators.maxLength(255)]],
    actif: [this.data.secteur?.actif ?? true]
  });

  get libelle() {
    return this.form.controls.libelle;
  }

  get description() {
    return this.form.controls.description;
  }

  ngOnInit(): void {
    if (this.readOnly) {
      this.form.disable();
    }

    if (!this.secteurId) {
      return;
    }

    /** Ne bloque pas l'ouverture de la popup : affiche d'abord la ligne cliquée (déjà dans
     * `data.secteur`), puis repatch silencieusement si l'API renvoie une version plus fraîche. */
    this.parametrageService.detailSecteurActivite(this.secteurId).subscribe((secteur) => {
      this.form.patchValue({
        libelle: secteur.libelle,
        description: secteur.description ?? '',
        actif: secteur.actif
      });
      this.detailView.set(secteur);
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
      libelle: raw.libelle,
      description: raw.description || null,
      actif: raw.actif
    };

    const request$ = this.isEdit
      ? this.parametrageService.updateSecteurActivite(this.secteurId!, payload)
      : this.parametrageService.createSecteurActivite(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success(this.isEdit ? 'Secteur mis à jour.' : 'Secteur créé.');
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
