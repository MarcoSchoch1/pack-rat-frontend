import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Collection, CollectionService } from '../service/collection.service';
import { InviteDialog } from '../invite-dialog/invite-dialog';
import { AuthService } from '../service/auth.service';

/** Landing screen: routes by collection count, and lists them once there are 2 or more (ADR-022). */
@Component({
  imports: [RouterLink, CurrencyPipe, InviteDialog],
  selector: 'app-collections-overview',
  templateUrl: './collections-overview.html',
})
export class CollectionsOverview {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly collections = signal<Collection[]>([]);
  protected readonly error = signal<string | null>(null);

  // Added without currency conversion (ADR-006); the footnote under the cards says so.
  protected readonly totalPricePaid = computed(() =>
    this.collections().reduce((sum, c) => sum + (c.totalPricePaid ?? 0), 0),
  );

  /** null when no collection has a current price, so the card shows "—" (ADR-017). */
  protected readonly totalPriceNow = computed(() => {
    const priced = this.collections().filter((c) => c.totalPriceNow !== null);
    return priced.length === 0 ? null : priced.reduce((sum, c) => sum + c.totalPriceNow!, 0);
  });

  constructor() {
    inject(CollectionService)
      .list()
      .subscribe({
        next: (collections) => {
          // Also catches returning users who skip the login screen.
          if (collections.length === 0) {
            void this.router.navigateByUrl('/collections/new', { replaceUrl: true });
          } else if (collections.length === 1) {
            void this.router.navigateByUrl(`/collections/${collections[0].id}`, { replaceUrl: true });
          } else {
            this.collections.set(collections);
          }
        },
        error: () => this.error.set('Could not load your collections, try again'),
      });
  }
}
