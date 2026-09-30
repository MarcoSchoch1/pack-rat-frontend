import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, map, switchMap } from 'rxjs';
import { Collection, CollectionService } from '../service/collection.service';
import { Currency, Item, ItemService } from '../service/item.service';

//fixed rates as of 30. September 2026
const CHF_PER_UNIT: Record<Currency, number> = { CHF: 1, EUR: 0.94, USD: 0.8 };

const toChf = (amount: number, currency: Currency) => amount * CHF_PER_UNIT[currency];

@Component({
  imports: [RouterLink, CurrencyPipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly collections = inject(CollectionService);
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

  protected readonly collection = signal<Collection | null>(null);
  protected readonly items = signal<Item[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly totalPricePaid = computed(() =>
    this.items().reduce((sum, item) => sum + toChf(item.pricePaid, item.currency), 0),
  );

  /** Only items with a current price count; null when none has one, so the card shows "—" (ADR-017). */
  protected readonly totalPriceNow = computed(() => {
    const priced = this.items().filter((item) => item.priceNow !== null);
    return priced.length === 0
      ? null
      : priced.reduce((sum, item) => sum + toChf(item.priceNow!, item.currency), 0);
  });

  constructor() {
    this.collections
      .list()
      .pipe(
        switchMap(([collection]) => {
          // Also catches returning users who skip the login screen and have no collection yet.
          if (!collection) {
            void this.router.navigateByUrl('/collections/new');
            return EMPTY;
          }
          return this.itemService
            .listByCollection(collection.id)
            .pipe(map((items) => ({ collection, items })));
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ collection, items }) => {
          this.collection.set(collection);
          this.items.set(items);
        },
        error: () => this.error.set('Could not load your collection, try again'),
      });
  }
}
