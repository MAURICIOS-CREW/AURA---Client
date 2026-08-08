import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/admin/auth/login`;

  login(login: string, password: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      this.apiUrl,
      {
        login,
        password
      }
    ).pipe(

      tap((response) => {

        localStorage.setItem(
          'aura_auth_token',
          response.access_token
        );

        localStorage.setItem(
          'aura_user',
          JSON.stringify(response.user)
        );

      })

    );

  }

  logout(): void {

    localStorage.removeItem('aura_auth_token');
    localStorage.removeItem('aura_user');

  }

  getToken(): string | null {

    return localStorage.getItem('aura_auth_token');

  }

  getCurrentUser() {

    const user = localStorage.getItem('aura_user');

    return user ? JSON.parse(user) : null;

  }

  isAuthenticated(): boolean {

    return !!this.getToken();

  }

}