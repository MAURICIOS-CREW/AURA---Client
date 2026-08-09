import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinanceService,
  FinanceSummary,
  FinanceMovement,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  ExpensePaymentMethod,
  PaymentTransfer,
} from '../services/finance.service';
import { SpinnerComponent } from '../shared/components/spinner/spinner';
import { ModalComponent } from '../shared/components/modal/modal';
import { ReportGeneratorComponent } from '../shared/components/report-generator/report-generator';

type TransferAction = 'approve' | 'reject';

interface MovementDetail {
  kind: 'payment' | 'expense';
  payment?: PaymentTransfer;
  expense?: Expense;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, FormsModule, SpinnerComponent, ModalComponent, ReportGeneratorComponent],
  templateUrl: './finance.html',
  styleUrl: './finance.scss',
})
export class Finance implements OnInit, OnDestroy {

  private financeService = inject(FinanceService);

  summary = signal<FinanceSummary | null>(null);
  movements = signal<FinanceMovement[]>([]);
  isLoadingSummary = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  pendingTransfers = signal<PaymentTransfer[]>([]);
  isLoadingTransfers = signal<boolean>(true);

  transferToReview = signal<PaymentTransfer | null>(null);
  transferAction = signal<TransferAction | null>(null);
  isProcessingTransfer = signal<boolean>(false);
  transferFeedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  private transferFeedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

  movementDetail = signal<MovementDetail | null>(null);
  isLoadingMovementDetail = signal<boolean>(false);
  movementDetailError = signal<string>('');
  isReceiptImageLoading = signal<boolean>(true);
  isReceiptImageBroken = signal<boolean>(false);

  concept: string = '';
  description: string = '';
  category: ExpenseCategory | '' = '';
  amount: number | null = null;
  expense_date: string = new Date().toISOString().substring(0, 10);
  provider: string = '';
  payment_method: ExpensePaymentMethod | '' = '';
  status: ExpenseStatus = 'paid';

  successMessage: string = '';
  errorMessage: string = '';
  private successTimeoutId: any = null;

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchPendingTransfers();
  }

  ngOnDestroy(): void {
    if (this.successTimeoutId) {
      clearTimeout(this.successTimeoutId);
    }
    if (this.transferFeedbackTimeoutId) {
      clearTimeout(this.transferFeedbackTimeoutId);
    }
  }

  fetchSummary(): void {
    this.isLoadingSummary.set(true);

    this.financeService.getSummary().subscribe({
      next: (response) => {
        this.summary.set(response.data);
        this.movements.set(response.data.recent_movements);
        this.isLoadingSummary.set(false);
      },
      error: (error) => {
        console.error('Error cargando el resumen financiero:', error);
        this.isLoadingSummary.set(false);
      }
    });
  }

  createExpensePayload() {
    return {
      concept: this.concept,
      description: this.description || null,
      category: this.category as ExpenseCategory,
      amount: Number(this.amount),
      expense_date: this.expense_date,
      provider: this.provider || null,
      payment_method: (this.payment_method || null) as ExpensePaymentMethod | null,
      status: this.status,
    };
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.successTimeoutId) {
      clearTimeout(this.successTimeoutId);
    }

    this.successMessage = '';
    this.errorMessage = '';
    this.isSubmitting.set(true);

    const payload = this.createExpensePayload();

    this.financeService.createExpense(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage = 'Egreso registrado correctamente.';
        this.resetForm();
        this.fetchSummary();

        this.successTimeoutId = setTimeout(() => {
          this.successMessage = '';
        }, 3500);
      },
      error: (err) => {
        console.error('Error al registrar el egreso:', err);

        this.isSubmitting.set(false);
        this.errorMessage =
          err.error?.message ?? 'No se pudo registrar el egreso. Intenta nuevamente.';
      }
    });
  }

  resetForm(): void {
    this.concept = '';
    this.description = '';
    this.category = '';
    this.amount = null;
    this.expense_date = new Date().toISOString().substring(0, 10);
    this.provider = '';
    this.payment_method = '';
    this.status = 'paid';
  }

  isPositive(value: string | number | null | undefined): boolean {
    return parseFloat(String(value ?? '0')) >= 0;
  }

  getMovementTypeClass(type: string): string {
    return type === 'income' ? 'income' : 'expense';
  }

  getMovementTypeLabel(type: string): string {
    return type === 'income' ? 'Ingreso' : 'Egreso';
  }

  getMovementStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return 'paid';

      case 'pending':
        return 'pending';

      default:
        return 'process';
    }
  }

  getMovementStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return 'Pagado';

      case 'pending':
        return 'Pendiente';

      case 'refused':
        return 'Rechazado';

      case 'cancelled':
        return 'Cancelado';

      case 'refunded':
        return 'Reembolsado';

      default:
        return 'En revisión';
    }
  }

  fetchPendingTransfers(): void {
    this.isLoadingTransfers.set(true);

    this.financeService.getPendingTransfers().subscribe({
      next: (response) => {
        this.pendingTransfers.set(response.data);
        this.isLoadingTransfers.set(false);
      },
      error: (error) => {
        console.error('Error cargando transferencias pendientes:', error);
        this.isLoadingTransfers.set(false);
      }
    });
  }

  transferConcept(transfer: PaymentTransfer): string {
    return transfer.financial_charge?.contracted_service?.service?.title ?? 'Cuota de mantenimiento';
  }

  askApproveTransfer(transfer: PaymentTransfer): void {
    this.transferToReview.set(transfer);
    this.transferAction.set('approve');
  }

  askRejectTransfer(transfer: PaymentTransfer): void {
    this.transferToReview.set(transfer);
    this.transferAction.set('reject');
  }

  closeTransferConfirm(): void {
    if (this.isProcessingTransfer()) {
      return;
    }
    this.transferToReview.set(null);
    this.transferAction.set(null);
  }

  confirmTransferReview(): void {
    const transfer = this.transferToReview();
    const action = this.transferAction();

    if (!transfer || !action || this.isProcessingTransfer()) {
      return;
    }

    this.isProcessingTransfer.set(true);

    const request$ = action === 'approve'
      ? this.financeService.approvePayment(transfer.id)
      : this.financeService.rejectPayment(transfer.id);

    request$.subscribe({
      next: (response) => {
        this.isProcessingTransfer.set(false);
        this.transferToReview.set(null);
        this.transferAction.set(null);
        this.showTransferFeedback('success', response.message);
        this.fetchSummary();
        this.fetchPendingTransfers();
      },
      error: (err) => {
        this.isProcessingTransfer.set(false);
        this.showTransferFeedback(
          'error',
          err.error?.message ?? 'No se pudo procesar la transferencia. Intenta nuevamente.'
        );
      }
    });
  }

  private showTransferFeedback(type: 'success' | 'error', message: string): void {
    if (this.transferFeedbackTimeoutId) {
      clearTimeout(this.transferFeedbackTimeoutId);
    }

    this.transferFeedback.set({ type, message });

    this.transferFeedbackTimeoutId = setTimeout(() => {
      this.transferFeedback.set(null);
    }, 4000);
  }

  openTransferDetail(transfer: PaymentTransfer): void {
    this.movementDetailError.set('');
    this.resetReceiptImageState();
    this.movementDetail.set({ kind: 'payment', payment: transfer });
  }

  openMovementDetail(movement: FinanceMovement): void {
    this.movementDetailError.set('');
    this.resetReceiptImageState();

    const numericId = Number(movement.id.replace(/^income-|^expense-/, ''));

    if (!numericId) {
      return;
    }

    this.isLoadingMovementDetail.set(true);
    this.movementDetail.set(null);

    if (movement.type === 'income') {
      this.financeService.getPayment(numericId).subscribe({
        next: (response) => {
          this.isLoadingMovementDetail.set(false);
          this.movementDetail.set({ kind: 'payment', payment: response.data });
        },
        error: (error) => {
          console.error('Error cargando el detalle del pago:', error);
          this.isLoadingMovementDetail.set(false);
          this.movementDetailError.set('No se pudo cargar el detalle de este movimiento.');
        }
      });
    } else {
      this.financeService.getExpense(numericId).subscribe({
        next: (response) => {
          this.isLoadingMovementDetail.set(false);
          this.movementDetail.set({ kind: 'expense', expense: response.data });
        },
        error: (error) => {
          console.error('Error cargando el detalle del egreso:', error);
          this.isLoadingMovementDetail.set(false);
          this.movementDetailError.set('No se pudo cargar el detalle de este movimiento.');
        }
      });
    }
  }

  closeMovementDetail(): void {
    this.movementDetail.set(null);
    this.movementDetailError.set('');
  }

  approveFromDetail(transfer: PaymentTransfer): void {
    this.closeMovementDetail();
    this.askApproveTransfer(transfer);
  }

  rejectFromDetail(transfer: PaymentTransfer): void {
    this.closeMovementDetail();
    this.askRejectTransfer(transfer);
  }

  canReviewTransfer(payment: PaymentTransfer): boolean {
    return payment.payment_method === 'transfer' && payment.status === 'pending';
  }

  resetReceiptImageState(): void {
    this.isReceiptImageLoading.set(true);
    this.isReceiptImageBroken.set(false);
  }

  onReceiptImageLoad(): void {
    this.isReceiptImageLoading.set(false);
  }

  onReceiptImageError(): void {
    this.isReceiptImageLoading.set(false);
    this.isReceiptImageBroken.set(true);
  }
}
