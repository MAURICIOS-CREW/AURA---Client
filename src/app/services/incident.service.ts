import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IncidentServiceItem {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;

  reporter?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface ApiResponse {
  status: string;
  data: IncidentServiceItem[];
}

@Injectable({
  providedIn: 'root'
})

export class IncidentService {

  private http = inject(HttpClient);
  private apiUrl = 'http://localhost/api/admin/incidents';

  getIncidents(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  getIncident(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  updateIncidentStatus(
    id: number,
    status: IncidentServiceItem['status']
  ): Observable<ApiResponse> {

    return this.http.put<ApiResponse>(
      `${this.apiUrl}/${id}`,
      { status }
    );
  }

  deleteIncident(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}