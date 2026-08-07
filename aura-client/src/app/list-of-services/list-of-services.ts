import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ContractedService, ContractedServiceItem } from '../services/contracted.service';

@Component({
  selector: 'app-list-of-services',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './list-of-services.html',
  styleUrl: './list-of-services.scss'
})

export class ListOfServices implements OnInit {
  private contractedService = inject(ContractedService);

  servicesList = signal<ContractedServiceItem[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.fetchServices();
  }

fetchServices(): void {
  this.contractedService.getContractedServices().subscribe({

    next: (response) => {
      console.log(response);       
      console.log(response.data);
      this.servicesList.set(response.data);
      this.isLoading.set(false);
    },

    error: (err) => {
      console.error('Error al cargar la lista de servicios:', err);
      this.isLoading.set(false);
    }

  });
}
  // Método auxiliar para asignar la clase CSS del estado
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PAGADO': return 'badge-success';
      case 'PENDIENTE': return 'badge-warning';
      case 'EN REVISIÓN': return 'badge-info';
      default: return 'badge-secondary';
    }
  }
}