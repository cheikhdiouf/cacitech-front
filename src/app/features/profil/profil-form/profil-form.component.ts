import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProfilService } from '../../../core/services/profil.service';
import { OrganigrammeService } from '../../../core/services/organigramme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Fonction, Organe } from '../../../core/models/organigramme.models';
import { Groupe } from '../../../core/models/groupe.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { FormActionsComponent } from '../../../shared/components/form-actions/form-actions.component';
import { FormSectionComponent } from '../../../shared/components/form-section/form-section.component';
import { DetailFieldComponent } from '../../../shared/components/detail-field/detail-field.component';
import { BreadcrumbComponent } from '../../../shared/layout/breadcrumb/breadcrumb.component';
import { Profil } from '../../../core/models/profil.models';

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Component({
  selector: 'app-profil-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    TextFieldComponent,
    FormActionsComponent,
    FormSectionComponent,
    DetailFieldComponent,
    BreadcrumbComponent
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
  readonly readOnly = this.route.snapshot.queryParamMap.get('readonly') === '1';

  readonly loading = signal(true);
  readonly isSubmitting = signal(false);
  readonly organes = signal<Organe[]>([]);
  readonly fonctions = signal<Fonction[]>([]);
  readonly groupesDisponibles = signal<Groupe[]>([]);
  readonly photoPreview = signal<string | null>(null);
  readonly detailView = signal<Profil | null>(null);

  readonly entiteLabel = computed(() => {
    const id = this.detailView()?.entite;
    return this.organes().find((o) => o.id === id)?.organe ?? '—';
  });

  readonly fonctionLabel = computed(() => {
    const id = this.detailView()?.fonction;
    return this.fonctions().find((f) => f.id === id)?.fonction ?? '—';
  });

  readonly groupesLabel = computed(() => {
    const ids = new Set(this.detailView()?.groupes ?? []);
    const names = this.groupesDisponibles()
      .filter((g) => ids.has(g.id))
      .map((g) => g.nom);
    return names.length ? names.join(', ') : 'Aucun';
  });

  readonly primeLabel = computed(() => {
    const prime = this.detailView()?.prime;
    return prime != null ? `${prime} FCFA` : '—';
  });
  private photoFile: File | null = null;
  /** true = l'utilisateur a explicitement retiré la photo existante (à distinguer de "aucun
   * changement") — sinon impossible de faire la différence entre "ne rien changer" et
   * "supprimer la photo" au moment de construire le payload. */
  private photoRemoved = false;
  /** URL blob locale (aperçu avant upload) — distincte de l'URL serveur, à révoquer nous-mêmes. */
  private objectUrl: string | null = null;

  readonly form = this.fb.nonNullable.group({
    matricule: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    nom: ['', [Validators.required, Validators.maxLength(30)]],
    prenom: ['', [Validators.required, Validators.maxLength(100)]],
    entite: ['', [Validators.required]],
    fonction: ['', [Validators.required]],
    telephone: ['', [Validators.maxLength(50)]],
    adresse: ['', [Validators.maxLength(200)]],
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

  get matricule() {
    return this.form.controls.matricule;
  }

  get telephone() {
    return this.form.controls.telephone;
  }

  get adresse() {
    return this.form.controls.adresse;
  }

  get entite() {
    return this.form.controls.entite;
  }

  get fonction() {
    return this.form.controls.fonction;
  }

  ngOnInit(): void {
    /** Listes de référence chargées en parallèle et indépendamment du reste : elles ne
     * bloquent que le remplissage des menus déroulants, jamais l'affichage du formulaire
     * lui-même — même pattern non bloquant que les popups organe/fonction/groupe. Chaque
     * appel passe par un RequestCache, donc déjà quasi instantané après le premier chargement
     * de l'app. */
    this.organigrammeService.listOrganes().subscribe({
      next: (organes) => this.organes.set(organes),
      error: () => this.notification.error('Impossible de charger les entités.')
    });
    this.organigrammeService.listFonctions().subscribe({
      next: (fonctions) => this.fonctions.set(fonctions),
      error: () => this.notification.error('Impossible de charger les fonctions.')
    });
    this.profilService.listGroupes().subscribe({
      next: (groupes) => this.groupesDisponibles.set(groupes),
      error: () => this.notification.error('Impossible de charger les groupes.')
    });

    if (!this.isEdit) {
      /** Création : rien à attendre, le formulaire est utilisable immédiatement — les
       * menus déroulants se peuplent en arrière-plan dès que les listes ci-dessus arrivent. */
      this.loading.set(false);
      return;
    }

    /** Édition/détail : contrairement aux popups, cette page n'a pas de ligne déjà connue
     * (passée via MAT_DIALOG_DATA) à afficher pendant le chargement — seul l'id de route est
     * disponible, donc le détail du profil reste la seule attente réellement incompressible
     * avant de pouvoir peupler le formulaire. */
    this.profilService.detailProfil(this.profilId!).subscribe({
      next: (profil) => {
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
        this.detailView.set(profil);
        if (this.readOnly) {
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Impossible de charger le profil.');
        this.loading.set(false);
      }
    });
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
    this.photoRemoved = false;
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(file);
    this.photoPreview.set(this.objectUrl);
  }

  removePhoto(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.photoFile = null;
    this.photoRemoved = true;
    this.revokeObjectUrl();
    this.photoPreview.set(null);
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  cancel(): void {
    this.router.navigate(['/profils']);
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
      removePhoto: this.photoRemoved,
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
