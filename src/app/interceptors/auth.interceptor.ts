import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

const LOGIN_URL_SEGMENT = '/auth/login';
const REFRESH_URL_SEGMENT = '/auth/refresh';

/**
 * Renovación de access token compartida entre peticiones concurrentes: si
 * varias requests reciben 401 al mismo tiempo, todas esperan la misma
 * llamada a /auth/refresh en vez de disparar una por cada una.
 */
let refreshInProgress$: Observable<string> | null = null;

function withHeaders(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return req.clone({ setHeaders: headers });

}

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(AuthService);

  const isLoginRequest = req.url.includes(LOGIN_URL_SEGMENT);
  const isRefreshRequest = req.url.includes(REFRESH_URL_SEGMENT);

  const tokenToAttach = isRefreshRequest
    ? authService.getRefreshToken()
    : (isLoginRequest ? null : authService.getToken());

  const authReq = withHeaders(req, tokenToAttach);

  return next(authReq).pipe(

    catchError((error: unknown) => {

      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // La llamada a /auth/refresh fue rechazada: el refresh token ya no
      // sirve (expiró, es inválido o el usuario fue baneado/desactivado).
      // No hay nada más que intentar: cerrar sesión y mandar al login.
      if (isRefreshRequest) {
        if (error.status === 401 || error.status === 403) {
          authService.logout();
        }
        return throwError(() => error);
      }

      // Login con credenciales inválidas, o un error que no es de sesión
      // expirada: se deja que el componente que hizo la petición lo maneje.
      if (isLoginRequest || error.status !== 401) {
        return throwError(() => error);
      }

      // 401 en un endpoint protegido sin refresh token disponible: no hay
      // sesión que renovar.
      if (!authService.getRefreshToken()) {
        authService.logout();
        return throwError(() => error);
      }

      return renewSessionAndRetry(authReq, next, authService);

    })

  );

};

function renewSessionAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {

  if (!refreshInProgress$) {

    refreshInProgress$ = authService.refreshToken().pipe(
      map((response) => response.access_token),
      finalize(() => {
        refreshInProgress$ = null;
      }),
      shareReplay(1)
    );

  }

  return refreshInProgress$.pipe(
    switchMap((newAccessToken) => next(withHeaders(req, newAccessToken)))
  );

}
