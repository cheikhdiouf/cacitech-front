import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';

@Component({
  selector: 'app-fonction-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatProgressSpinnerModule, MatIconModule, TextFieldComponent],
  templateUrl: './fonction-form.component.html',
  styleUrl: './fonction-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FonctionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly fonctionId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.fonctionId !== null;

  readonly loading = signal(this.isEdit);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    fonction: ['', [Validators.required]],
    abreviation: [''],
    description: [''],
    actif: [true]
  });

  get fonction() {
    return this.form.controls.fonction;
  }

  ngOnInit(): void {
    if (!this.isEdit) {
      return;
    }

    this.organigrammeService.detailFonction(this.fonctionId!).subscribe({
      next: (fonction) => {
        this.form.patchValue({
          fonction: fonction.fonction,
          abreviation: fonction.abreviation ?? '',
          description: fonction.description ?? '',
          actif: fonction.actif
        });
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Impossible de charger la fonction.');
        this.loading.set(false);
      }
    });
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
        this.router.navigate(['/organigramme/fonctions']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
