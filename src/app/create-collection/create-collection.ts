import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CollectionService } from '../service/collection.service';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-create-collection',
  styleUrl: './create-collection.css',
  templateUrl: './create-collection.html',
})
export class CreateCollection {
  private readonly router = inject(Router);
  private readonly collections = inject(CollectionService);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
  });
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.collections.create(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.submitting.set(false);
        this.error.set('creating Collection failed, try again');
      },
    })
  }
}
