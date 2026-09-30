import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiError } from '../service/apiservice';
import { CollectionService } from '../service/collection.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly collections = inject(CollectionService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.auth
      .login(this.form.getRawValue())
      // Only runs once login succeeded, so the interceptor already has a token to attach.
      .pipe(switchMap(() => this.collections.list()))
      .subscribe({
        next: (collections) =>
          void this.router.navigateByUrl(collections.length === 0 ? '/collections/new' : '/'),
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(
            err instanceof ApiError && err.status === 401
              ? 'Wrong username or password'
              : 'Login failed, try again',
          );
        },
      });
  }
}
