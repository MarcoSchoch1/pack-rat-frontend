import { Service, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './apiservice';

export interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  jwtAccessToken: string;
}

const TOKEN_STORAGE_KEY = 'packrat.accessToken';
// Treat tokens as expired slightly early so a request never leaves with a token that dies in transit.
const EXPIRY_LEEWAY_MS = 10_000;

@Service()
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly token = signal<string | null>(readStoredToken());

  /** The stored JWT if it has not expired, otherwise null. */
  accessToken(): string | null {
    const token = this.token();
    return token !== null && !isExpired(token) ? token : null;
  }

  isAuthenticated(): boolean {
    return this.accessToken() !== null;
  }

  login(credentials: LoginRequest): Observable<void> {
    return this.api.post<LoginResponse>('auth/login', credentials).pipe(
      tap(({ jwtAccessToken }) => this.setToken(jwtAccessToken)),
      map(() => undefined),
    );
  }

  logout(): void {
    this.setToken(null);
    void this.router.navigate(['/login']);
  }

  private setToken(token: string | null): void {
    this.token.set(token);
    try {
      if (token === null) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // Storage blocked (e.g. privacy mode): the token still lives in memory for this tab.
    }
  }
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Reads the `exp` claim. The signature is the backend's job; this only avoids sending dead tokens. */
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp !== 'number' || exp * 1000 - EXPIRY_LEEWAY_MS <= Date.now();
  } catch {
    return true;
  }
}
