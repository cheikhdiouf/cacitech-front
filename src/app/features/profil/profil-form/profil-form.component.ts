import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { ProfilService } from '../../../core/services/profil.service';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction, Organe } from '../../../core/models/organigramme.models';
import { Groupe } from '../../../core/models/groupe.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Component({
  selector: 'app-profil-form',
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
  templateUrl: './profil-form.component.html',
  styleUrl: './profil-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly profilService = inject(ProfilService);
  private readonly organigrammeService = inject(OrganigrammeService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly profilId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.profilId !== null;

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly organes = signal<Organe[]>([]);
  readonly fonctions = signal<Fonction[]>([]);
  readonly groupesDisponibles = signal<Groupe[]>([]);
  readonly photoPreview = signal<string | null>(null);
  private photoFile: File | null = null;
  /** URL blob locale (aperçu avant upload) — distincte de l'URL serveur, à révoquer nous-mêmes. */
  private objectUrl: string | null = null;

  readonly form = this.fb.nonNullable.group({
    matricule: [''],
    email: ['', [Validators.required, Validators.email]],
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    entite: ['', [Validators.required]],
    fonction: ['', [Validators.required]],
    telephone: [''],
    adresse: [''],
    prime: [0],
    actif: [true],
    groupes: this.fb.nonNullable.control<string[]>([])
  });

  get email() {
    return this.form.controls.email;
  }

  get nom() {
    return this.form.controls.nom;
  }

  get prenom() {
    return this.form.controls.prenom;
  }

  ngOnInit(): void {
    const reference$ = forkJoin([
      this.organigrammeService.listOrganes(),
      this.organigrammeService.listFonctions(),
      this.profilService.listGroupes()
    ]);

    if (this.isEdit) {
      forkJoin([reference$, this.profilService.detailProfil(this.profilId!)]).subscribe({
        next: ([[organes, fonctions, groupes], profil]) => {
          this.organes.set(organes);
          this.fonctions.set(fonctions);
          this.groupesDisponibles.set(groupes);
          this.form.patchValue({
            matricule: profil.matricule ?? '',
            email: profil.email,
            nom: profil.nom,
            prenom: profil.prenom,
            entite: profil.entite,
            fonction: profil.fonction,
            telephone: profil.telephone ?? '',
            adresse: profil.adresse ?? '',
            prime: profil.prime,
            actif: profil.actif,
            groupes: profil.groupes
          });
          this.photoPreview.set(profil.photo);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Impossible de charger le profil.');
          this.loading.set(false);
        }
      });
    } else {
      reference$.subscribe({
        next: ([organes, fonctions, groupes]) => {
          this.organes.set(organes);
          this.fonctions.set(fonctions);
          this.groupesDisponibles.set(groupes);
          this.loading.set(false);
        },
        error: () => {
          this.notification.error('Impossible de charger les données de référence.');
          this.loading.set(false);
        }
      });
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      this.notification.error('Format d’image non supporté (JPEG, PNG ou WEBP uniquement).');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      this.notification.error('L’image dépasse la taille maximale autorisée (5 Mo).');
      return;
    }

    this.photoFile = file;
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(file);
    this.photoPreview.set(this.objectUrl);
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
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
      matricule: raw.matricule || null,
      email: raw.email,
      nom: raw.nom,
      prenom: raw.prenom,
      entite: raw.entite,
      fonction: raw.fonction,
      telephone: raw.telephone || null,
      adresse: raw.adresse || null,
      actif: raw.actif,
      prime: raw.prime,
      photo: this.photoFile,
      groupes: raw.groupes
    };

    const request$ = this.isEdit
      ? this.profilService.updateProfil(this.profilId!, payload)
      : this.profilService.createProfil(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success(this.isEdit ? 'Profil mis à jour.' : 'Profil créé.');
        this.router.navigate(['/profils']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.notification.error('Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }
}
