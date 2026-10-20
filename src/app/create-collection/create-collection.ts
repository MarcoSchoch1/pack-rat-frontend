import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CollectionService } from '../service/collection.service';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
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
  /** Set by the "New collection" buttons; first-time users have nowhere to go back to, so no Cancel. */
  protected readonly from = inject(ActivatedRoute).snapshot.queryParamMap.get('from');
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    this.collections.create(this.form.getRawValue()).subscribe({
      next: (collection) => void this.router.navigateByUrl(`/collections/${collection.id}`),
      error: () => {
        this.submitting.set(false);
        this.error.set('creating Collection failed, try again');
      },
    })
  }
}
