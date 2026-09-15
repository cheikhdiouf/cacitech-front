import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction } from '../../../core/models/organigramme.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { DetailFieldComponent } from '../../../shared/components/detail-field/detail-field.component';

export interface FonctionFormDialogData {
  fonction: Fonction | null;
  readOnly?: boolean;
}

@Component({
  selector: 'app-fonction-form',
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
  templateUrl: './fonction-form.component.html',
  styleUrl: './fonction-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<FonctionFormComponent, boolean>);
  private readonly data = inject<FonctionFormDialogData>(MAT_DIALOG_DATA);

  private readonly fonctionId = this.data.fonction?.id ?? null;
  readonly isEdit = this.fonctionId !== null;
  readonly readOnly = this.data.readOnly ?? false;
  readonly title = this.readOnly ? 'Détails de la fonction' : this.isEdit ? 'Modifier la fonction' : 'Nouvelle fonction';

  readonly isSubmitting = signal(false);
  readonly detailView = signal<Fonction | null>(this.data.fonction);

  readonly form = this.fb.nonNullable.group({
    fonction: [this.data.fonction?.fonction ?? '', [Validators.required, Validators.maxLength(255)]],
    abreviation: [this.data.fonction?.abreviation ?? '', [Validators.maxLength(15)]],
    description: [this.data.fonction?.description ?? '', [Validators.maxLength(400)]],
    actif: [this.data.fonction?.actif ?? true]
  });

  get fonction() {
    return this.form.controls.fonction;
  }

  get abreviation() {
    return this.form.controls.abreviation;
  }

  get description() {
    return this.form.controls.description;
  }

  ngOnInit(): void {
    if (this.readOnly) {
      this.form.disable();
    }

    if (!this.fonctionId) {
      return;
    }

    /** Ne bloque pas l'ouverture de la popup : affiche d'abord la ligne cliquée (déjà dans
     * `data.fonction`), puis repatch silencieusement si l'API renvoie une version plus fraîche. */
    this.organigrammeService.detailFonction(this.fonctionId).subscribe((fonction) => {
      this.form.patchValue({
        fonction: fonction.fonction,
        abreviation: fonction.abreviation ?? '',
        description: fonction.description ?? '',
        actif: fonction.actif
      });
      this.detailView.set(fonction);
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
      fonction: raw.fonction,
      abreviation: raw.abreviation || null,
      description: raw.description || null,
      actif: raw.actif
    };

    const request$ = this.isEdit
      ? this.organigrammeService.updateFonction(this.fonctionId!, payload)
      : this.organigrammeService.createFonction(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success(this.isEdit ? 'Fonction mise à jour.' : 'Fonction créée.');
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
