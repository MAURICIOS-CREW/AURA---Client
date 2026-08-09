import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SpinnerComponent } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, SpinnerComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  errorMessage = '';
  isSubmitting = signal(false);

  loginForm = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {

    this.errorMessage = '';

    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { login, password } = this.loginForm.getRawValue();

    this.isSubmitting.set(true);

    this.authService.login(login!, password!).subscribe({

      next: () => {

        console.log('✅ Login exitoso');

        this.router.navigate(['/']);

      },

      error: (err) => {

        console.error(err);

        this.errorMessage =
          err.error?.error ??
          'Ocurrió un error inesperado. Intenta nuevamente.';

        this.isSubmitting.set(false);

      }

    });

  }

}