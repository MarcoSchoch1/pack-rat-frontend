import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiService } from './apiservice';

/** The currencies the add-item form offers. */
export const CURRENCIES = ['CHF', 'EUR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Backend enum value → label, in grading order (see data-model-mvp.md). */
export const CONDITIONS = {
  MINT: 'Mint',
  NEAR_MINT: 'Near Mint',
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  LIGHT_PLAYED: 'Light Played',
  PLAYED: 'Played',
  POOR: 'Poor',
} as const;
export type Condition = keyof typeof CONDITIONS;

/** Mirrors the backend's ItemResponse. Dates arrive as ISO strings. */
export interface Item {
  id: string;
  collectionId: string;
  name: string;
  pricePaid: number;
  priceNow: number | null;
  currency: Currency;
  dateAcquired: string;
  condition: Condition;
  marketPlaceLink: string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors the backend's ItemRequest. dateAcquired is `yyyy-mm-dd`, which is what `<input type="date">` gives. */
export interface ItemRequest {
  name: string;
  pricePaid: number;
  priceNow: number | null;
  currency: Currency;
  dateAcquired: string;
  condition: Condition;
  marketPlaceLink: string;
}

/** The parts of the backend's ImageResponse the frontend uses. */
export interface Image {
  id: string;
  itemId: string;
  url: string;
}

@Service()
export class ItemService {
  private readonly api = inject(ApiService);
  private readonly baseUrl = inject(API_BASE_URL);

  listByCollection(collectionId: string): Observable<Item[]> {
    return this.api.get<Item[]>(`collections/${collectionId}/items`);
  }

  create(collectionId: string, request: ItemRequest): Observable<Item> {
    return this.api.post<Item>(`collections/${collectionId}/items`, request);
  }

  /** Multipart upload; the backend reads the `file` field and rejects anything over 5 MB. */
  uploadImage(itemId: string, file: File): Observable<Image> {
    const body = new FormData();
    body.append('file', file);
    return this.api.post<Image>(`items/${itemId}/images`, body);
  }

  images(itemId: string): Observable<Image[]> {
    return this.api.get<Image[]>(`items/${itemId}/images`);
  }

  /**
   * For `<img src>`. The backend's `Image.url` is relative to the backend's own origin, which is not
   * the frontend's in dev, so build it from the API base. Public, no token needed (ADR-018).
   */
  imageUrl(imageId: string): string {
    return `${this.baseUrl}/images/${imageId}`;
  }
}
