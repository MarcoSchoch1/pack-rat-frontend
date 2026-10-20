import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './apiservice';

/** Mirrors the backend's CollectionResponse. */
export interface Collection {
  id: string;
  userId: string;
  name: string;
  itemCount: number;
  totalPricePaid: number | null;
  totalPriceNow: number | null;
}

export interface CollectionRequest {
  name: string;
}

@Service()
export class CollectionService {
  private readonly api = inject(ApiService);

  /** The current user's collections, each with its item count and totals (ADR-022). */
  list(): Observable<Collection[]> {
    return this.api.get<Collection[]>('collections');
  }

  create(collectionRequest: CollectionRequest): Observable<Collection> {
    return this.api.post<Collection>('collections', collectionRequest);
  }
}
