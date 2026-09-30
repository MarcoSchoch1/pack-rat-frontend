import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './apiservice';

/** The currencies the add-item form offers. */
export type Currency = 'CHF' | 'EUR' | 'USD';

/** Mirrors the backend's ItemResponse. Dates arrive as ISO strings. */
export interface Item {
  id: string;
  collectionId: string;
  name: string;
  pricePaid: number;
  priceNow: number | null;
  currency: Currency;
  dateAcquired: string;
  condition: 'MINT' | 'NEAR_MINT' | 'EXCELLENT' | 'GOOD' | 'LIGHT_PLAYED' | 'PLAYED' | 'POOR';
  marketPlaceLink: string;
  createdAt: string;
  updatedAt: string;
}

@Service()
export class ItemService {
  private readonly api = inject(ApiService);

  listByCollection(collectionId: string): Observable<Item[]> {
    return this.api.get<Item[]>(`collections/${collectionId}/items`);
  }
}
