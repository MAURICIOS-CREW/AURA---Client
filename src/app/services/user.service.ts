import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Resident {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface ResidentsResponse {
  status: string;
  data: Resident[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/residents`;

  getResidents(): Observable<ResidentsResponse> {
    return this.http.get<ResidentsResponse>(this.apiUrl);
  }
}