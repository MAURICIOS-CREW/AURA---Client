import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ContractedService, ContractedServiceItem } from '../services/contracted.service';
import { ReportGeneratorComponent } from '../shared/components/report-generator/report-generator';

@Component({
  selector: 'app-list-of-services',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, ReportGeneratorComponent],
  templateUrl: './list-of-services.html',
  styleUrl: './list-of-services.scss'
})

export class ListOfServices implements OnInit {
  private contractedService = inject(ContractedService);

  servicesList = signal<ContractedServiceItem[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.fetchServices();
  }

fetchServices(): void {
    this.contractedService.getContractedServices().subscribe({
      next: (response) => {
        console.log(response);
        console.log(response.data);

        console.log(
          'ESTADOS:',
          response.data.map(item => item.financial_charge?.status)
        );

        this.servicesList.set(response.data);
        this.isLoading.set(false);
      },

      error: (err) => {
        console.error('Error al cargar la lista de servicios:', err);
        this.isLoading.set(false);
      }
    });
}

getStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'badge-paid';

    case 'pending':
      return 'badge-pending';

    case 'in_progress':
      return 'badge-in-progress';

    case 'refunded':
      return 'badge-refunded';

    case 'cancelled':
      return 'badge-cancelled';

    default:
      return 'badge-unknown';
  }
}

getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'Pagado';

    case 'pending':
      return 'Pendiente';

    case 'in_progress':
      return 'En progreso';

    case 'refunded':
      return 'Reembolsado';

    case 'cancelled':
      return 'Cancelado';

    default:
      return 'Sin estado';
  }
}

}