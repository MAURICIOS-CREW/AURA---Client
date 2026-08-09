import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, RefreshResponse } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'aura_auth_token';
const REFRESH_TOKEN_KEY = 'aura_refresh_token';
const USER_KEY = 'aura_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private authUrl = `${environment.apiUrl}/admin/auth`;

  login(login: string, password: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.authUrl}/login`,
      {
        login,
        password
      }
    ).pipe(

      tap((response) => {

        localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      })

    );

  }

  /**
   * Solicita un nuevo access token usando el refresh token vigente.
   * El interceptor es responsable de anexar el refresh token a esta petición.
   */
  refreshToken(): Observable<RefreshResponse> {

    return this.http.post<RefreshResponse>(
      `${this.authUrl}/refresh`,
      {}
    ).pipe(

      tap((response) => {
        this.setAccessToken(response.access_token);
      })

    );

  }

  setAccessToken(accessToken: string): void {

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  }

  logout(redirectToLogin: boolean = true): void {

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }

  }

  getToken(): string | null {

    return localStorage.getItem(ACCESS_TOKEN_KEY);

  }

  getRefreshToken(): string | null {

    return localStorage.getItem(REFRESH_TOKEN_KEY);

  }

  getCurrentUser() {

    const user = localStorage.getItem(USER_KEY);

    return user ? JSON.parse(user) : null;

  }

  /**
   * Indica si existe una sesión iniciada. Se basa en el refresh token porque
   * es el que determina la vigencia real de la sesión (30 días); el access
   * token vive solo 3 horas y su renovación la maneja el interceptor.
   */
  isAuthenticated(): boolean {

    return !!this.getRefreshToken();

  }

}
