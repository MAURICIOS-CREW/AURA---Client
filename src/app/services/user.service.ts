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

export interface ResidentResidence {
  id: number;
  address_id: number;
  block: string;
  number: string;
  intercom_number?: string | null;

  address?: {
    id: number;
    name: string;
    cp: string;
  };
}

export interface ResidentResidencesResponse {
  status: string;
  data: ResidentResidence[];
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

  getResidentResidences(userId: number): Observable<ResidentResidencesResponse> {
    return this.http.get<ResidentResidencesResponse>(`${this.apiUrl}/${userId}/residences`);
  }
}