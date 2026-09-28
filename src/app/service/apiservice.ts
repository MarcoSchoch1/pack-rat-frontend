import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { InjectionToken, Service, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/** Base URL of the backend API, without a trailing slash. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => environment.apiUrl.replace(/\/+$/, ''),
});

type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number | boolean)[]
>;

/** Error body the backend returns for failed requests (see pack-rat-docs/backend/api-design.md). */
interface ApiErrorBody {
  error?: string;
  message?: string;
  field?: string;
}

/** Normalized error thrown by every ApiService call, so callers never deal with HttpErrorResponse. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Single entry point for all calls to the Pack-Rat backend. Paths are relative to API_BASE_URL. */
@Service()
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', path, { body });
  }

  delete<T = void>(path: string): Observable<T> {
    return this.request<T>('DELETE', path, {});
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PATCH', path, { body });
  }

  private request<T>(
    method: string,
    path: string,
    options: { body?: unknown; params?: QueryParams },
  ): Observable<T> {
    const url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    return this.http
      .request<T>(method, url, options)
      .pipe(
        catchError((err: unknown) =>
          throwError(() => (err instanceof HttpErrorResponse ? toApiError(err) : err)),
        ),
      );
  }
}

function toApiError(err: HttpErrorResponse): ApiError {
  if (err.status === 0) {
    return new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server.');
  }
  const body: ApiErrorBody = typeof err.error === 'object' && err.error !== null ? err.error : {};
  return new ApiError(err.status, body.error ?? 'HTTP_ERROR', body.message ?? err.message, body.field);
}
