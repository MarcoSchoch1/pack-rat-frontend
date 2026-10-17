import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './apiservice';

/** Mirrors the backend's InviteResponse (ADR-021). */
export interface Invite {
  url: string;
  expiresAt: string;
}

@Service()
export class InviteService {
  private readonly api = inject(ApiService);

  /** Each call creates a new single-use link, valid for 7 days. */
  create(): Observable<Invite> {
    return this.api.post<Invite>('invites', null);
  }

  /** Public. Errors with 404 if the invite is unknown, used or expired. */
  check(token: string): Observable<void> {
    return this.api.get<void>(`invites/${encodeURIComponent(token)}`);
  }
}
