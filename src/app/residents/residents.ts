import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService, Resident } from '../services/user.service';

@Component({
  selector: 'app-residents',
  imports: [],
  templateUrl: './residents.html',
  styleUrl: './residents.scss',
})
export class Residents implements OnInit {

  private userService = inject(UserService);

  residents = signal<Resident[]>([]);

  ngOnInit(): void {
    this.userService.getResidents().subscribe({
      next: (response) => {
        this.residents.set(response.data);
      }
    });
  }

}