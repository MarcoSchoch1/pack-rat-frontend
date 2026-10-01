import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { CollectionService } from '../service/collection.service';
import { CONDITIONS, CURRENCIES, Condition, Currency, ItemService } from '../service/item.service';

/** Same limit as the backend's spring.servlet.multipart.max-file-size. */
const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

@Component({
  imports: [RouterLink, ReactiveFormsModule],
  selector: 'app-add-item',
  styleUrl: './add-item.css',
  templateUrl: './add-item.html',
})
export class AddItem {
  private readonly collections = inject(CollectionService);
  private readonly items = inject(ItemService);
  private readonly router = inject(Router);

  /** Set on `items/:id/edit`; the same form then edits that item instead of adding one. */
  protected readonly itemId = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly currencies = CURRENCIES;
  protected readonly conditions = Object.entries(CONDITIONS) as [Condition, string][];

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    selfPulled: [false],
    pricePaid: [null as number | null, [Validators.required, Validators.min(0.0)]],
    currency: ['CHF' as Currency, Validators.required],
    priceNow: [null as number | null, Validators.min(0)],
    dateAcquired: ['', Validators.required],
    condition: ['NEAR_MINT' as Condition, Validators.required],
    marketPlaceLink: ['', Validators.maxLength(255)],
  });
  protected readonly picture = signal<File | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  constructor() {
    // A self-pulled card cost nothing; getRawValue() still includes the disabled 0.
    const pricePaid = this.form.controls.pricePaid;
    this.form.controls.selfPulled.valueChanges.pipe(takeUntilDestroyed()).subscribe((pulled) => {
      if (pulled) {
        pricePaid.setValue(0);
        pricePaid.disable();
      } else {
        pricePaid.enable();
      }
    });

    if (this.itemId) {
      this.items.get(this.itemId).subscribe({
        next: (item) => this.form.patchValue(item),
        error: () => this.error.set('Loading the item failed'),
      });
    }
  }

  /** Used by both the file input and drag and drop; `accept` doesn't apply to drops, so check the type here. */
  protected pickPicture(files: FileList | null | undefined): void {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('The picture must be an image');
    } else if (file.size > MAX_PICTURE_BYTES) {
      this.error.set('The picture must be 5 MB or smaller');
    } else {
      this.error.set(null);
      this.picture.set(file);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      // Reveals the red borders on every field that still needs input.
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);

    const { pricePaid, ...rest } = this.form.getRawValue();
    const picture = this.picture();

    const request = { ...rest, pricePaid: pricePaid! };
    const itemId = this.itemId;
    const save = itemId
      ? this.items.update(itemId, request)
      : this.collections.list().pipe(switchMap(([collection]) => this.items.create(collection.id, request)));
    const done = itemId ? `/items/${itemId}` : '/';

    save
      .pipe(
        // The picture is a separate call (ADR-008), and it needs the new item's id.
        // If only the upload fails the item already exists, so go to its page to add the picture
        // there instead of staying here, where another save would create a duplicate.
        switchMap((item) =>
          picture
            ? this.items.uploadImage(item.id, picture).pipe(
                map(() => done),
                catchError(() => of(`/items/${item.id}`)),
              )
            : of(done),
        ),
      )
      .subscribe({
        next: (url) => void this.router.navigateByUrl(url),
        error: () => {
          this.submitting.set(false);
          this.error.set('Saving the item failed, try again');
        },
      });
  }
}
