import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CatalogService,
  CatalogServiceItem,
  CreateCatalogServicePayload,
} from '../services/catalog.service';
import {
  ContractedService,
  ContractedServiceItem,
  AssignServicePayload,
} from '../services/contracted.service';
import { UserService, Resident, ResidentResidence } from '../services/user.service';
import { ReportGeneratorComponent } from '../shared/components/report-generator/report-generator';
import { ModalComponent } from '../shared/components/modal/modal';
import { SpinnerComponent } from '../shared/components/spinner/spinner';
import { ContractedServiceDetail } from '../shared/components/contracted-service-detail/contracted-service-detail';
import {
  contractedServiceNeedsSchedule,
  getContractedServiceStatusClass,
  getContractedServiceStatusLabel,
} from '../shared/utils/contracted-service-status';

const CARD_COLORS = ['blue', 'purple', 'yellow', 'green', 'red', 'orange'];

@Component({
  selector: 'app-list-of-services',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CurrencyPipe,
    FormsModule,
    ReportGeneratorComponent,
    ModalComponent,
    SpinnerComponent,
    ContractedServiceDetail,
  ],
  templateUrl: './list-of-services.html',
  styleUrl: './list-of-services.scss'
})

export class ListOfServices implements OnInit {
  private catalogService = inject(CatalogService);
  private contractedService = inject(ContractedService);
  private userService = inject(UserService);

  // --- Catálogo de servicios ---
  catalogList = signal<CatalogServiceItem[]>([]);
  isLoadingCatalog = signal(true);

  showCatalogModal = signal(false);
  editingCatalogService = signal<CatalogServiceItem | null>(null);
  isSubmittingCatalog = signal(false);
  catalogFormError = signal('');

  catalogTitle = '';
  catalogDescription = '';
  catalogPrice: number | null = null;
  catalogIsActive = true;
  catalogImages: File[] = [];

  deletingCatalogService = signal<CatalogServiceItem | null>(null);
  isDeletingCatalog = signal(false);

  // --- Últimos servicios contratados ---
  servicesList = signal<ContractedServiceItem[]>([]);
  isLoading = signal(true);

  selectedContractedService = signal<ContractedServiceItem | null>(null);

  sortedServicesList = computed(() => {
    return [...this.servicesList()].sort((a, b) => {
      // Solo los servicios en 'created' (sin horario asignado todavía) van primero.
      // Un cancelado/reembolsado sin exact_scheduled_at no cuenta como pendiente de
      // agendar, así que se queda en el orden normal por fecha de creación.
      const aNeedsSchedule = this.needsSchedule(a) ? 0 : 1;
      const bNeedsSchedule = this.needsSchedule(b) ? 0 : 1;

      if (aNeedsSchedule !== bNeedsSchedule) {
        return aNeedsSchedule - bNeedsSchedule;
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  // --- Asignar servicio ---
  assigningService = signal<CatalogServiceItem | null>(null);
  isSubmittingAssign = signal(false);
  assignError = signal('');

  residentsList = signal<Resident[]>([]);
  isLoadingResidents = signal(false);

  residentResidences = signal<ResidentResidence[]>([]);
  isLoadingResidences = signal(false);

  assignResidentId: number | null = null;
  assignResidenceId: number | null = null;
  assignDate: string = new Date().toISOString().substring(0, 10);
  assignTimeFrom: string = '09:00';
  assignTimeTo: string = '11:00';
  assignNotes: string = '';
  assignMarkAsPaid = false;
  assignPaymentMethod: 'cash' | 'transfer' | 'card' | 'check' | '' = '';

  ngOnInit(): void {
    this.fetchCatalog();
    this.fetchServices();
  }

  // ==================== CATÁLOGO ====================

  fetchCatalog(): void {
    this.isLoadingCatalog.set(true);

    this.catalogService.getServices().subscribe({
      next: (response) => {
        this.catalogList.set(response.data);
        this.isLoadingCatalog.set(false);
      },

      error: (err) => {
        console.error('Error al cargar el catálogo de servicios:', err);
        this.isLoadingCatalog.set(false);
      }
    });
  }

  getCardColor(index: number): string {
    return CARD_COLORS[index % CARD_COLORS.length];
  }

  openCreateCatalogModal(): void {
    this.editingCatalogService.set(null);
    this.catalogTitle = '';
    this.catalogDescription = '';
    this.catalogPrice = null;
    this.catalogIsActive = true;
    this.catalogImages = [];
    this.catalogFormError.set('');
    this.showCatalogModal.set(true);
  }

  openEditCatalogModal(service: CatalogServiceItem): void {
    this.editingCatalogService.set(service);
    this.catalogTitle = service.title;
    this.catalogDescription = service.description ?? '';
    this.catalogPrice = Number(service.price);
    this.catalogIsActive = service.is_active;
    this.catalogImages = [];
    this.catalogFormError.set('');
    this.showCatalogModal.set(true);
  }

  closeCatalogModal(): void {
    if (this.isSubmittingCatalog()) {
      return;
    }
    this.showCatalogModal.set(false);
    this.editingCatalogService.set(null);
  }

  onCatalogImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.catalogImages = input.files ? Array.from(input.files) : [];
  }

  submitCatalogForm(): void {
    if (this.isSubmittingCatalog() || !this.catalogTitle.trim() || !this.catalogPrice) {
      return;
    }

    this.catalogFormError.set('');
    this.isSubmittingCatalog.set(true);

    const payload: CreateCatalogServicePayload = {
      title: this.catalogTitle.trim(),
      description: this.catalogDescription.trim() || null,
      price: Number(this.catalogPrice),
      is_active: this.catalogIsActive,
    };

    const editing = this.editingCatalogService();

    if (editing) {
      this.catalogService.updateService(editing.id, payload).subscribe({
        next: () => {
          if (this.catalogImages.length > 0) {
            this.catalogService.uploadImages(editing.id, this.catalogImages).subscribe({
              next: () => this.onCatalogSaved(),
              error: (err) => this.onCatalogSaveError(err),
            });
          } else {
            this.onCatalogSaved();
          }
        },
        error: (err) => this.onCatalogSaveError(err),
      });
    } else {
      this.catalogService.createService(payload, this.catalogImages).subscribe({
        next: () => this.onCatalogSaved(),
        error: (err) => this.onCatalogSaveError(err),
      });
    }
  }

  private onCatalogSaved(): void {
    this.isSubmittingCatalog.set(false);
    this.showCatalogModal.set(false);
    this.editingCatalogService.set(null);
    this.fetchCatalog();
  }

  private onCatalogSaveError(err: any): void {
    console.error('Error al guardar el servicio del catálogo:', err);
    this.isSubmittingCatalog.set(false);
    this.catalogFormError.set(
      err.error?.message ?? 'No se pudo guardar el servicio. Intenta nuevamente.'
    );
  }

  askDeleteCatalogService(service: CatalogServiceItem): void {
    this.deletingCatalogService.set(service);
  }

  closeDeleteCatalogModal(): void {
    if (this.isDeletingCatalog()) {
      return;
    }
    this.deletingCatalogService.set(null);
  }

  confirmDeleteCatalogService(): void {
    const service = this.deletingCatalogService();

    if (!service || this.isDeletingCatalog()) {
      return;
    }

    this.isDeletingCatalog.set(true);

    this.catalogService.deleteService(service.id).subscribe({
      next: () => {
        this.isDeletingCatalog.set(false);
        this.deletingCatalogService.set(null);
        this.fetchCatalog();
      },

      error: (err) => {
        console.error('Error al eliminar el servicio del catálogo:', err);
        this.isDeletingCatalog.set(false);
      }
    });
  }

  // ==================== ASIGNAR SERVICIO ====================

  openAssignModal(service: CatalogServiceItem): void {
    this.assigningService.set(service);
    this.assignResidentId = null;
    this.assignResidenceId = null;
    this.assignDate = new Date().toISOString().substring(0, 10);
    this.assignTimeFrom = '09:00';
    this.assignTimeTo = '11:00';
    this.assignNotes = '';
    this.assignMarkAsPaid = false;
    this.assignPaymentMethod = '';
    this.assignError.set('');
    this.residentResidences.set([]);

    if (this.residentsList().length === 0) {
      this.isLoadingResidents.set(true);
      this.userService.getResidents().subscribe({
        next: (response) => {
          this.residentsList.set(response.data);
          this.isLoadingResidents.set(false);
        },
        error: (err) => {
          console.error('Error al cargar residentes:', err);
          this.isLoadingResidents.set(false);
        }
      });
    }
  }

  closeAssignModal(): void {
    if (this.isSubmittingAssign()) {
      return;
    }
    this.assigningService.set(null);
  }

  onAssignResidentChange(): void {
    this.assignResidenceId = null;
    this.residentResidences.set([]);

    if (!this.assignResidentId) {
      return;
    }

    this.isLoadingResidences.set(true);
    this.userService.getResidentResidences(this.assignResidentId).subscribe({
      next: (response) => {
        this.residentResidences.set(response.data);
        this.isLoadingResidences.set(false);
      },
      error: (err) => {
        console.error('Error al cargar residencias del residente:', err);
        this.isLoadingResidences.set(false);
      }
    });
  }

  submitAssign(): void {
    const service = this.assigningService();

    if (
      !service ||
      this.isSubmittingAssign() ||
      !this.assignResidentId ||
      !this.assignResidenceId ||
      !this.assignDate ||
      !this.assignTimeFrom ||
      !this.assignTimeTo
    ) {
      return;
    }

    if (this.assignMarkAsPaid && !this.assignPaymentMethod) {
      this.assignError.set('Selecciona el método de pago recibido.');
      return;
    }

    this.assignError.set('');
    this.isSubmittingAssign.set(true);

    const payload: AssignServicePayload = {
      user_id: this.assignResidentId,
      residence_id: this.assignResidenceId,
      service_id: service.id,
      preferred_date: this.assignDate,
      visit_time_from: this.assignTimeFrom,
      visit_time_to: this.assignTimeTo,
      notes: this.assignNotes || null,
      mark_as_paid: this.assignMarkAsPaid,
      payment_method: this.assignMarkAsPaid ? (this.assignPaymentMethod as any) : undefined,
    };

    this.contractedService.assignService(payload).subscribe({
      next: () => {
        this.isSubmittingAssign.set(false);
        this.assigningService.set(null);
        this.fetchServices();
      },

      error: (err) => {
        console.error('Error al asignar el servicio:', err);
        this.isSubmittingAssign.set(false);
        this.assignError.set(
          err.error?.message ?? 'No se pudo asignar el servicio. Intenta nuevamente.'
        );
      }
    });
  }

  // ==================== ÚLTIMOS SERVICIOS CONTRATADOS ====================

  fetchServices(): void {
    this.contractedService.getContractedServices().subscribe({
      next: (response) => {
        this.servicesList.set(response.data);
        this.isLoading.set(false);

        const current = this.selectedContractedService();
        if (current) {
          this.selectedContractedService.set(
            response.data.find(item => item.id === current.id) ?? null
          );
        }
      },

      error: (err) => {
        console.error('Error al cargar la lista de servicios:', err);
        this.isLoading.set(false);
      }
    });
  }

  openDetailModal(item: ContractedServiceItem): void {
    this.selectedContractedService.set(item);
  }

  closeDetailModal(): void {
    this.selectedContractedService.set(null);
  }

  onContractedServiceUpdated(): void {
    this.fetchServices();
  }

  needsSchedule(item: ContractedServiceItem): boolean {
    return contractedServiceNeedsSchedule(item.status);
  }

  getStatusClass = getContractedServiceStatusClass;
  getStatusLabel = getContractedServiceStatusLabel;

}
