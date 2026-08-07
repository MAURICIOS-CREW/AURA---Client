import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessLogService, AccessLog } from '../services/access-log.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
private accessLogService = inject(AccessLogService);

  accessLogsList = signal<AccessLog[]>([]);
  isLoading = signal<boolean>(true);
  
  ngOnInit(): void {
    this.fetchAccessLogs();
  }

  fetchAccessLogs(): void {
     this.accessLogService
      .getAccessLogs(' ')
      .subscribe({

        next:(response)=>{
          this.accessLogsList.set(response.data);
          this.isLoading.set(false);

        },

        error:(error)=>{

          console.error(
            'Error cargando accesos peatonales',
            error
          );

          this.isLoading.set(false);

        }

      });

  }


}
