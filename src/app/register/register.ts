import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '../service/apiservice';
import { AuthService } from '../service/auth.service';
import { InviteService } from '../service/invite.service';

/** Sign-up, only through an invite link `/register?invite=<token>` (ADR-021). */
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-register',
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly inviteToken = inject(ActivatedRoute).snapshot.queryParamMap.get('invite');

  /** `checking` until the backend confirmed the link; `invalid` shows only the dead-link message. */
  protected readonly invite = signal<'checking' | 'valid' | 'invalid'>('checking');
  // Same limits as the backend (ADR-021). confirmPassword stays in the browser; it's never sent.
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  constructor() {
    if (!this.inviteToken) {
      this.invite.set('invalid');
      return;
    }
    inject(InviteService)
      .check(this.inviteToken)
      .subscribe({
        next: () => this.invite.set('valid'),
        error: () => this.invite.set('invalid'),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    const { username, password } = this.form.getRawValue();
    this.auth
      .register({ inviteToken: this.inviteToken!, username: username.trim(), password })
      .subscribe({
        // A new user has no collection yet, so the first-login flow always ends here.
        next: () => void this.router.navigateByUrl('/collections/new'),
        error: (err: unknown) => {
          this.submitting.set(false);
          if (err instanceof ApiError && err.status === 409) {
            // Cleared by Angular as soon as the user edits the field.
            this.form.controls.username.setErrors({ taken: true });
          } else if (err instanceof ApiError && err.status === 404) {
            this.invite.set('invalid');
          } else {
            this.error.set('Creating the account failed, try again');
          }
        },
      });
  }
}

/** On the group, not the field, so editing either password re-checks the pair. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { password, confirmPassword } = group.value as {
    password: string;
    confirmPassword: string;
  };
  return password === confirmPassword ? null : { passwordMismatch: true };
}
