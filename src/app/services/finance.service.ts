import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ExpenseCategory =
  | 'maintenance'
  | 'security'
  | 'utilities'
  | 'salaries'
  | 'services'
  | 'supplies'
  | 'other';

export type ExpenseStatus = 'pending' | 'paid' | 'cancelled';

export type ExpensePaymentMethod = 'cash' | 'transfer' | 'card' | 'check';

export interface Expense {
  id: number;
  concept: string;
  description: string | null;
  category: ExpenseCategory;
  amount: number | string;
  expense_date: string;
  provider: string | null;
  payment_method: ExpensePaymentMethod | null;
  status: ExpenseStatus;
  receipt: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;

  registered_by?: {
    id: number;
    name: string;
    username: string;
  };
}

export interface CreateExpensePayload {
  concept: string;
  description?: string | null;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  provider?: string | null;
  payment_method?: ExpensePaymentMethod | null;
  status?: ExpenseStatus;
}

export interface ExpensesApiResponse {
  status: string;
  data: Expense[];
}

export interface ExpenseApiResponse {
  status: string;
  message?: string;
  data: Expense;
}

export interface FinanceMovement {
  id: string;
  type: 'income' | 'expense';
  concept: string;
  counterpart: string;
  amount: number | string;
  status: string;
  date: string;
}

export interface FinanceSummary {
  income_month: string;
  expenses_month: string;
  net_month: string;
  total_income: string;
  total_expenses: string;
  current_balance: string;
  recent_movements: FinanceMovement[];
}

export interface FinanceSummaryApiResponse {
  status: string;
  data: FinanceSummary;
}

export type PaymentStatus = 'approved' | 'pending' | 'refused' | 'refunded' | 'cancelled';

export interface PaymentTransfer {
  id: number;
  charge_id: number;
  user_id: number;
  amount: number | string;
  payment_method: string;
  receipt: string | null;
  receipt_url: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    username: string;
    email: string;
  };
  financial_charge?: {
    id: number;
    residence_id: number;
    amount: number | string;
    month: number;
    year: number;
    status: string;
    contracted_service?: {
      id: number;
      service?: { id: number; title: string } | null;
    } | null;
  };
  validator_admin?: { id: number; name: string } | null;
}

export interface PaymentTransfersApiResponse {
  status: string;
  data: PaymentTransfer[];
}

export interface PaymentTransferApiResponse {
  status: string;
  message: string;
  data: PaymentTransfer;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {

  private http = inject(HttpClient);

  private expensesUrl = `${environment.apiUrl}/admin/expenses`;
  private summaryUrl = `${environment.apiUrl}/admin/finance/summary`;
  private paymentsUrl = `${environment.apiUrl}/admin/payments`;

  getSummary(): Observable<FinanceSummaryApiResponse> {
    return this.http.get<FinanceSummaryApiResponse>(this.summaryUrl);
  }

  getPendingTransfers(): Observable<PaymentTransfersApiResponse> {
    return this.http.get<PaymentTransfersApiResponse>(this.paymentsUrl, {
      params: { payment_method: 'transfer', status: 'pending' },
    });
  }

  approvePayment(id: number): Observable<PaymentTransferApiResponse> {
    return this.http.patch<PaymentTransferApiResponse>(`${this.paymentsUrl}/${id}/approve`, {});
  }

  rejectPayment(id: number): Observable<PaymentTransferApiResponse> {
    return this.http.patch<PaymentTransferApiResponse>(`${this.paymentsUrl}/${id}/reject`, {});
  }

  getExpenses(): Observable<ExpensesApiResponse> {
    return this.http.get<ExpensesApiResponse>(this.expensesUrl);
  }

  getExpense(id: number): Observable<ExpenseApiResponse> {
    return this.http.get<ExpenseApiResponse>(`${this.expensesUrl}/${id}`);
  }

  createExpense(payload: CreateExpensePayload): Observable<ExpenseApiResponse> {
    return this.http.post<ExpenseApiResponse>(this.expensesUrl, payload);
  }

  deleteExpense(id: number): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(`${this.expensesUrl}/${id}`);
  }

  getPayment(id: number): Observable<PaymentTransferApiResponse> {
    return this.http.get<PaymentTransferApiResponse>(`${this.paymentsUrl}/${id}`);
  }
}
