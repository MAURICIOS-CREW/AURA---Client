import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ContractedServiceStatus =
  | 'created'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'refunded'
  | 'cancelled';

export interface ContractedServiceItem {
  id: number;
  created_at: string;
  updated_at: string;
  status: ContractedServiceStatus;

  preferred_date?: string;
  visit_time_from?: string;
  visit_time_to?: string;
  exact_scheduled_at?: string | null;
  amount?: number | string;
  notes?: string | null;
  payment_method?: string | null;

  service?: {
    id: number;
    title: string;
    price?: number | string;
  };

  user?: {
    id: number;
    name: string;
    username?: string;
    email?: string;
    phone?: string;
  };

  residence?: {
    id: number;
    address_id: number;
    block: string;
    number: string;
    intercom_number?: string | null;

    address?: {
      id: number;
      name: string;
      cp: string;
      created_at: string;
      updated_at: string;
    };
  };

  financial_charge?: {
    id: number;
    amount: number | string;
    status: string;
    payments?: Array<{
      id: number;
      amount: number | string;
      payment_method: string;
      status: string;
      receipt_url: string | null;
      created_at: string;
    }>;
  };

  access_code?: {
    id: number;
    code: string;
    valid_from: string;
    valid_until: string;
  } | null;
}

export interface AssignServicePayload {
  user_id: number;
  residence_id: number;
  service_id: number;
  preferred_date: string;
  visit_time_from: string;
  visit_time_to: string;
  notes?: string | null;
  mark_as_paid?: boolean;
  payment_method?: 'cash' | 'transfer' | 'card' | 'check';
}

export interface SchedulePayload {
  exact_scheduled_at: string;
  notes?: string | null;
}

export interface ApiResponse {
  status: string;
  data: ContractedServiceItem[];
}

export interface SingleApiResponse {
  status: string;
  message?: string;
  data: ContractedServiceItem;
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

  assignService(payload: AssignServicePayload): Observable<SingleApiResponse> {
    return this.http.post<SingleApiResponse>(this.apiUrl, payload);
  }

  scheduleService(id: number, payload: SchedulePayload): Observable<SingleApiResponse> {
    return this.http.post<SingleApiResponse>(`${this.apiUrl}/${id}/schedule`, payload);
  }

  updateServiceStatus(
    id: number,
    status: ContractedServiceStatus,
    notes?: string | null
  ): Observable<SingleApiResponse> {
    return this.http.patch<SingleApiResponse>(`${this.apiUrl}/${id}/status`, { status, notes });
  }
}
