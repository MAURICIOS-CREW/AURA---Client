import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessLogService, AccessLog } from '../services/access-log.service';
import { IncidentService, IncidentServiceItem } from '../services/incident.service';
import { ContractedService, ContractedServiceItem } from '../services/contracted.service';
import { UserService, Resident } from '../services/user.service';
import { ReportGeneratorComponent } from '../shared/components/report-generator/report-generator';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReportGeneratorComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
private accessLogService = inject(AccessLogService);
private incidentService = inject(IncidentService);
private userService = inject(UserService);
private contractedService = inject(ContractedService);

  accessLogsList = signal<AccessLog[]>([]);
  residents = signal<Resident[]>([]);
  incidentsList = signal<IncidentServiceItem[]>([]);
  pendingServices = signal<ContractedServiceItem[]>([]);
  completedServicesThisMonth = signal<number>(0);
  openIncidents = signal<number>(0);

  isLoadingAccessLogs = signal<boolean>(true);
  isLoadingResidents = signal<boolean>(true);
  isLoadingIncidentStats = signal<boolean>(true);
  isLoadingServices = signal<boolean>(true);

  incidentStatusStats = signal({
    open: 0,
    viewed: 0,
    in_progress: 0,
    attended: 0
  });

  
ngOnInit(): void {
  this.fetchAccessLogs();
  this.fetchIncidents();
  this.fetchPendingServices();
  this.fetchResidents();
}

fetchAccessLogs(): void {
     this.accessLogService
      .getAccessLogs(' ')
      .subscribe({

        next:(response)=>{
          this.accessLogsList.set(response.data);
          this.isLoadingAccessLogs.set(false);

        },

        error:(error)=>{

          console.error(
            'Error cargando accesos peatonales',
            error
          );

          this.isLoadingAccessLogs.set(false);

        }

      });

}

fetchIncidents(): void {
  this.incidentService.getIncidents().subscribe({
    next: (response) => {
      this.incidentsList.set(response.data);

const stats = response.data.reduce(
    (acc, incident) => {
      if (incident.status === 'open') {
        acc.open++;
      }

      if (incident.status === 'viewed') {
        acc.viewed++;
      }

      if (incident.status === 'in_progress') {
        acc.in_progress++;
      }

      if (incident.status === 'attended') {
        acc.attended++;
      }

          return acc;
        },
        {
          open: 0,
          viewed: 0,
          in_progress: 0,
          attended: 0
        }
      );

      this.incidentStatusStats.set(stats);
      this.openIncidents.set(stats.open);
      this.isLoadingIncidentStats.set(false);
    },

    error: (error) => {
      console.error(
        'Error cargando incidencias del dashboard:',
        error
      );

      this.isLoadingIncidentStats.set(false);
    }
  });
}

fetchResidents(): void {
  this.userService.getResidents().subscribe({
    next: (response) => {
      this.residents.set(response.data);
      this.isLoadingResidents.set(false);
    },

    error: (error) => {
      console.error(
        'Error cargando residentes del dashboard:',
        error
      );

      this.isLoadingResidents.set(false);
    }
  });
}

fetchPendingServices(): void {
  this.contractedService.getContractedServices().subscribe({
    next: (response) => {

      const pending = response.data.filter(
        service =>
          service.status === 'created' ||
          service.status === 'in_progress'
      );

      this.pendingServices.set(pending);

      const now = new Date();
      const completedThisMonth = response.data.filter(service => {
        if (service.status !== 'completed') {
          return false;
        }

        const updatedAt = new Date(service.updated_at);
        return (
          updatedAt.getMonth() === now.getMonth() &&
          updatedAt.getFullYear() === now.getFullYear()
        );
      });

      this.completedServicesThisMonth.set(completedThisMonth.length);
      this.isLoadingServices.set(false);
    },

    error: (error) => {
      console.error(
        'Error cargando servicios pendientes:',
        error
      );

      this.isLoadingServices.set(false);
    }
  });
}

getAccessTypeClass(access_type: string): string {
  switch (access_type?.toLowerCase()) {
    case 'qr':
      return 'badge-qr';

    case 'plate':
      return 'badge-plate';

    default:
      return 'badge-unknown';
  }
}

getAccessTypeLabel(access_type: string): string {
  switch (access_type?.toLowerCase()) {
    case 'qr':
      return 'Por QR';

    case 'plate':
      return 'Por Placa';

    default:
      return 'Sin estado';
  }
}

getMethodClass(method: string): string {
  switch (method?.toLowerCase()) {
    case 'scan':
      return 'badge-scan';

    case 'manual':
      return 'badge-manual';

    default:
      return 'badge-unknown';
  }
}

getMethodLabel(method: string): string {
  switch (method?.toLowerCase()) {
    case 'scan':
      return 'Escaner';

    case 'manual':
      return 'Manual';

    default:
      return 'Desconocido';
  }
}

getServiceStatusClass(status: string): string {
  switch (status?.toLowerCase()) {
    case 'created':
      return 'badge-created';

    case 'in_progress':
      return 'badge-in-progress';

    default:
      return 'badge-unknown';
  }
}

getServiceStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'created':
      return 'Creado';

    case 'in_progress':
      return 'En progreso';

    default:
      return 'Desconocido';
  }
}

}
