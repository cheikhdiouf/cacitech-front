import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction } from '../../../core/models/organigramme.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';

export interface FonctionFormDialogData {
  fonction: Fonction | null;
}

@Component({
  selector: 'app-fonction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    TextFieldComponent,
    FormActionsComponent,
    DialogHeaderComponent,
    FormSectionComponent
  ],
  templateUrl: './fonction-form.component.html',
  styleUrl: './fonction-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<FonctionFormComponent, boolean>);
  private readonly data = inject<FonctionFormDialogData>(MAT_DIALOG_DATA);

  private readonly fonctionId = this.data.fonction?.id ?? null;
  readonly isEdit = this.fonctionId !== null;
  readonly title = this.isEdit ? 'Modifier la fonction' : 'Nouvelle fonction';

  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    fonction: [this.data.fonction?.fonction ?? '', [Validators.required]],
    abreviation: [this.data.fonction?.abreviation ?? ''],
    description: [this.data.fonction?.description ?? ''],
    actif: [this.data.fonction?.actif ?? true]
  });

  get fonction() {
    return this.form.controls.fonction;
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
