import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

export interface CreateIncidentPayload {
  reporter_user_id: number;
  title: string;
  description: string;
  status: string;
}

export interface IncidentComment {
  id: number;
  incident_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;

  user?: {
    id: number;
    name: string;
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
  private apiUrl = `${environment.apiUrl}/admin/incidents`;

getIncidents(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

getIncident(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`);
  }


createIncident(payload: {
  reporter_user_id: number | null;
  title: string;
  description: string;
  status: string;
}): Observable<IncidentServiceItem> {
  return this.http.post<IncidentServiceItem>(
    this.apiUrl,
    payload
  );
}

getIncidentComments(id: number): Observable<IncidentComment[]> {
  return this.http.get<IncidentComment[]>(
    `${this.apiUrl}/${id}/comments`
  );
  }

addIncidentComment(
  incidentId: number,
  content: string
  ): Observable<IncidentComment> {
    return this.http.post<IncidentComment>(
      `${this.apiUrl}/${incidentId}/comments`,
      { content }
    );
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