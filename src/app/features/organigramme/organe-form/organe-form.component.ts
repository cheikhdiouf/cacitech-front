import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { ProfilService } from '../../../core/services/profil.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Organe } from '../../../core/models/organigramme.models';
import { Profil } from '../../../core/models/profil.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';

@Component({
  selector: 'app-organe-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    TextFieldComponent
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly organeId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.organeId !== null;

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly organesDisponibles = signal<Organe[]>([]);
  readonly profils = signal<Profil[]>([]);

  readonly form = this.fb.nonNullable.group({
    organe: ['', [Validators.required]],
    abreviation: ['', [Validators.required]],
    organe_superieure: [''],
    responsable: [''],
    actif: [true]
  });

  get organe() {
    return this.form.controls.organe;
  }

  get abreviation() {
    return this.form.controls.abreviation;
  }

  ngOnInit(): void {
    const reference$ = forkJoin([this.organigrammeService.listOrganes(), this.profilService.listProfils()]);

    if (this.isEdit) {
      forkJoin([reference$, this.organigrammeService.detailOrgane(this.organeId!)]).subscribe({
        next: ([[organes, profils], organeDetail]) => {
          this.organesDisponibles.set(organes.filter((o) => o.id !== this.organeId));
          this.profils.set(profils);
          this.form.patchValue({
            organe: organeDetail.organe,
            abreviation: organeDetail.abreviation,
            organe_superieure: organeDetail.organe_superieure ?? '',
            responsable: organeDetail.responsable ?? '',
            actif: organeDetail.actif
          });
          this.loading.set(false);
        },
        error: () => {
          this.notification.error("Impossible de charger l'entité.");
          this.loading.set(false);
        }
      });
    } else {
      reference$.subscribe({
        next: ([organes, profils]) => {
          this.organesDisponibles.set(organes);
          this.profils.set(profils);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Impossible de charger les données de référence.');
          this.loading.set(false);
        }
      });
    }
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
        this.router.navigate(['/organigramme/organes']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
