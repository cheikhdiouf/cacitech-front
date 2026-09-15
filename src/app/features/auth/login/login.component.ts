import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthError } from '../../../core/models/auth.models';
import { TextFieldComponent } from '../../../shared/components/text-field/text-field.component';
import { PasswordFieldComponent } from '../../../shared/components/password-field/password-field.component';
import { AuthAlertComponent } from '../../../shared/components/auth-alert/auth-alert.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    TextFieldComponent,
    PasswordFieldComponent,
    AuthAlertComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [true]
  });

  get username() {
    return this.form.controls.username;
  }

  get password() {
    return this.form.controls.password;
  }

  usernameErrorMessage(): string | null {
    if (this.username.hasError('required')) return 'L’identifiant est requis.';
    return null;
  }

  passwordErrorMessage(): string | null {
    if (this.password.hasError('required')) return 'Le mot de passe est requis.';
    return null;
  }

  submit(): void {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { username, password, rememberMe } = this.form.getRawValue();

    this.authService.login({ username, password, rememberMe }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notification.success('Connexion réussie. Bienvenue !');
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/accueil';
        this.router.navigateByUrl(redirectTo);
      },
      error: (err: AuthError) => {
        this.isSubmitting.set(false);
        const message = err?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
        this.serverError.set(message);
        this.notification.error(message);
      }
    });
  }
}
