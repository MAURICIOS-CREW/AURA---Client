import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AccessLog {
    id: number;
    access_type: string;
    method: string;
    status: string;
    message: string;
    timestamp: string;

    accessCode?: {
        guest_name: string;
    };

    vehicle?: {
        plate: string;
        brand: string;
        color: string;
    };

    residence?: {
        block: string;
    };
}

export interface ApiResponse {
    status: string;
    data: AccessLog[];
}

@Injectable({
  providedIn: 'root'
})
export class AccessLogService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost/api/admin/access-logs';

  getAccessLogs(category?: string): Observable<ApiResponse> {

    let params = new HttpParams();

    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<ApiResponse>(this.apiUrl, { params });
  }

}