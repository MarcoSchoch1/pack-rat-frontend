import { Service, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, tap } from 'rxjs';
import { ApiService } from './apiservice';

export interface LoginRequest {
  username: string;
  password: string;
}

/** Mirrors the backend's RegisterRequest (ADR-021). */
export interface RegisterRequest {
  inviteToken: string;
  username: string;
  password: string;
}

/** The JWT itself travels in an httpOnly cookie; the body only says when it dies (ADR-019). */
interface LoginResponse {
  expiresAt: string;
}

const EXPIRES_AT_STORAGE_KEY = 'packrat.expiresAt';
// Left behind by the pre-cookie version, which kept the JWT in localStorage.
const LEGACY_TOKEN_STORAGE_KEY = 'packrat.accessToken';
// Treat the session as over slightly early so a request never leaves with a cookie that dies in transit.
const EXPIRY_LEEWAY_MS = 10_000;

@Service()
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly expiresAt = signal<number | null>(readStoredExpiry());

  isAuthenticated(): boolean {
    const expiresAt = this.expiresAt();
    return expiresAt !== null && expiresAt - EXPIRY_LEEWAY_MS > Date.now();
  }

  login(credentials: LoginRequest): Observable<void> {
    return this.authenticate('auth/login', credentials);
  }

  /** Creates the account from an invite and logs straight in; the backend answers like login. */
  register(request: RegisterRequest): Observable<void> {
    return this.authenticate('auth/register', request);
  }

  /** Asks the backend to drop the cookie; the local session ends even if that call fails. */
  logout(): void {
    this.api
      .post<void>('auth/logout', null)
      .pipe(finalize(() => this.endSession()))
      .subscribe({ error: () => {} });
  }

  /** Forgets the session locally, e.g. after a 401 when the cookie is already dead. */
  endSession(): void {
    this.setExpiresAt(null);
    void this.router.navigate(['/login']);
  }

  private authenticate(path: string, body: LoginRequest | RegisterRequest): Observable<void> {
    return this.api.post<LoginResponse>(path, body).pipe(
      tap(({ expiresAt }) => this.setExpiresAt(Date.parse(expiresAt))),
      map(() => undefined),
    );
  }

  private setExpiresAt(expiresAt: number | null): void {
    this.expiresAt.set(expiresAt);
    try {
      if (expiresAt === null) {
        localStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
      } else {
        localStorage.setItem(EXPIRES_AT_STORAGE_KEY, String(expiresAt));
      }
    } catch {
      // Storage blocked (e.g. privacy mode): the session still lives in memory for this tab.
    }
  }
}

function readStoredExpiry(): number | null {
  try {
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    const stored = Number(localStorage.getItem(EXPIRES_AT_STORAGE_KEY));
    return stored > 0 ? stored : null;
  } catch {
    return null;
  }
}
