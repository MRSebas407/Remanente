import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { ChangePassword } from '../shared/change-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ChangePassword],
  template: `
    @if (showForcePassword()) {
      <app-change-password [forced]="true" (saved)="onPasswordChanged()" />
    }

    <div class="min-h-screen flex items-center justify-center bg-secondary">
      <div
        class="w-full max-w-md bg-accent rounded-xl shadow-lg p-8 border border-theme"
      >
        <div class="flex justify-end mb-2">
          <button (click)="toggleTheme()" class="text-xs px-3 py-1.5 rounded-lg border border-theme hover:bg-accent-hover transition-colors text-secondary flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              @if (isDark()) {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              } @else {
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              }
            </svg>
            {{ isDark() ? 'Claro' : 'Oscuro' }}
          </button>
        </div>
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-primary">App Iglesia</h1>
          <p class="text-secondary mt-1 text-sm">Inicia sesión para continuar</p>
        </div>

        @if (error()) {
          <div
            class="mb-4 p-3 rounded-lg text-sm"
            style="background-color: #fef2f2; color: var(--color-error); border: 1px solid #fecaca;"
          >
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label
              for="username"
              class="block text-sm font-medium mb-1"
              style="color: var(--color-text);"
            >
              Usuario
            </label>
            <input
              id="username"
              type="text"
              [(ngModel)]="username"
              name="username"
              required
              autocomplete="username"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent focus:outline-none focus:ring-2 focus:ring-black/20 text-sm"
              style="color: var(--color-text);"
              placeholder="Ingresa tu usuario"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium mb-1"
              style="color: var(--color-text);"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent focus:outline-none focus:ring-2 focus:ring-black/20 text-sm"
              style="color: var(--color-text);"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover"
          >
            {{ loading() ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showForcePassword = signal(false);
  isDark = signal(localStorage.getItem('theme') === 'dark');

  constructor() {
    this.applyTheme();
  }

  private applyTheme(): void {
    const dark = this.isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.body.style.backgroundColor = dark ? '#0f0f1a' : '#f5f5f5';
  }

  toggleTheme(): void {
    this.isDark.update(v => !v);
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
    this.applyTheme();
  }

  onSubmit(): void {
    if (!this.username || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        if (this.auth.mustChangePassword()) {
          this.loading.set(false);
          this.showForcePassword.set(true);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.error.set(err.error?.error || 'Usuario o contraseña incorrectos');
        } else {
          this.error.set('Error de conexión con el servidor');
        }
      },
    });
  }

  onPasswordChanged(): void {
    this.showForcePassword.set(false);
    this.router.navigate(['/']);
  }
}
