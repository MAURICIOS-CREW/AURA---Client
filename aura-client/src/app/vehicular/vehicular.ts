import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessLogService, AccessLog } from '../services/access-log.service';

@Component({
  selector: 'app-vehicular',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicular.html',
  styleUrl: './vehicular.scss',
})

export class Vehicular implements OnInit {
  private accessLogService = inject(AccessLogService);

  accessLogsList = signal<AccessLog[]>([]);
  isLoading = signal<boolean>(true);
  
  ngOnInit(): void {
    this.fetchAccessLogs();
  }

  fetchAccessLogs(): void {
     this.accessLogService
      .getAccessLogs('vehicle')
      .subscribe({

        next:(response)=>{
          this.accessLogsList.set(response.data);
          this.isLoading.set(false);

        },

        error:(error)=>{

          console.error(
            'Error cargando accesos vehiculares',
            error
          );

          this.isLoading.set(false);

        }

      });

  }


}
