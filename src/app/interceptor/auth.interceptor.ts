import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../service/apiservice';
import { AuthService } from '../service/auth.service';

/** Lets the browser send the auth cookie to the backend and ends the session when the backend rejects it. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  // Only our own backend gets credentials; never send cookies to third-party URLs.
  const isApiRequest = req.url === baseUrl || req.url.startsWith(`${baseUrl}/`);
  if (!isApiRequest) {
    return next(req);
  }

  const auth = inject(AuthService);
  return next(req.clone({ withCredentials: true })).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.endSession();
      }
      return throwError(() => err);
    }),
  );
};
