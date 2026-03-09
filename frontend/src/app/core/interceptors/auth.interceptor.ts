import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // See oauth-integration.md → Step 6: Make Authenticated API Requests
  // Skip Authorization header for the token-exchange call itself
  const isTokenExchange = req.url.includes('challenge/');

  const cloned = (token && !isTokenExchange)
    ? req.clone({ setHeaders: { Authorization: token } }) // No Bearer prefix per Kisan spec
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
