import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


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
    address?: {
      street: string;
      number: string;
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
  // La URL que validamos en Docker/Postman
  private apiUrl = 'http://localhost/api/admin/contracted-services';

  getContractedServices(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }
}