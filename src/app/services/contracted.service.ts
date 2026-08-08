import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContractedServiceItem {
  id: number;
  created_at: string;

  service?: {
    title: string;
  };

  user?: {
    name: string;
  };

  residence?: {
    id: number;
    address_id: number;
    block: string;
    number: string;
    interior_number?: string | null;

    address?: {
      id: number;
      name: string;
      cp: string;
      created_at: string;
      updated_at: string;
    };
  };

  financial_charge?: {
    amount: number | string;
    status: string;
  };
}

export interface ApiResponse {
  status: string;
  data: ContractedServiceItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ContractedService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/admin/contracted-services`;

  getContractedServices(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }
}