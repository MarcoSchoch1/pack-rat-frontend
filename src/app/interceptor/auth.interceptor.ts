import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../service/apiservice';
import { AuthService } from '../service/auth.service';

/** Adds `Authorization: Bearer <jwt>` to backend requests and logs out when the backend rejects it. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  // Only our own backend gets the token; never leak it to third-party URLs.
  const isApiRequest = req.url === baseUrl || req.url.startsWith(`${baseUrl}/`);
  if (!isApiRequest) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.accessToken();
  if (token === null) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
