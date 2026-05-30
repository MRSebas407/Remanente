import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden">
  <div class="bg-accent shadow-xl w-full max-w-md mx-4 my-12 rounded-xl flex flex-col" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">{{ forced() ? 'Debes cambiar tu contraseña' : 'Cambiar contraseña' }}</h2>
      @if (!forced()) {
        <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
      }
    </div>
    <div class="p-4 space-y-4">
      @if (forced()) {
        <p class="text-sm text-secondary">Por seguridad, debes establecer una nueva contraseña antes de continuar.</p>
      }

      <div>
        <label class="block text-sm font-medium mb-1 text-primary">Nueva contraseña</label>
        <input type="password" [(ngModel)]="newPassword" name="newPassword"
          (input)="validate()"
          class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          [class.border-red-400]="newPassword && !passwordValid"
          placeholder="••••••" />
        @if (newPassword && !passwordValid) {
          <ul class="mt-1 space-y-0.5">
            <li class="text-xs" [class.text-green-600]="newPassword.length >= 8" [class.text-red-500]="newPassword.length > 0 && newPassword.length < 8">
              {{ newPassword.length >= 8 ? '✓' : '○' }} Mínimo 8 caracteres
            </li>
            <li class="text-xs" [class.text-green-600]="hasUpper" [class.text-red-500]="newPassword.length > 0 && !hasUpper">
              {{ hasUpper ? '✓' : '○' }} Al menos una mayúscula
            </li>
            <li class="text-xs" [class.text-green-600]="hasLower" [class.text-red-500]="newPassword.length > 0 && !hasLower">
              {{ hasLower ? '✓' : '○' }} Al menos una minúscula
            </li>
            <li class="text-xs" [class.text-green-600]="hasNumber" [class.text-red-500]="newPassword.length > 0 && !hasNumber">
              {{ hasNumber ? '✓' : '○' }} Al menos un número
            </li>
            <li class="text-xs" [class.text-green-600]="hasSpecial" [class.text-red-500]="newPassword.length > 0 && !hasSpecial">
              {{ hasSpecial ? '✓' : '○' }} Al menos un carácter especial (!@#$%^&*)
            </li>
          </ul>
        }
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-primary">Repite la nueva contraseña</label>
        <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword"
          (input)="validate()"
          class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          [class.border-red-400]="confirmPassword && newPassword !== confirmPassword"
          placeholder="••••••" />
        @if (confirmPassword && newPassword !== confirmPassword) {
          <p class="text-xs text-red-500 mt-0.5">Las contraseñas no coinciden</p>
        }
      </div>

      <div class="flex gap-3 pt-2">
        <button (click)="onSubmit()" [disabled]="loading() || !passwordValid || newPassword !== confirmPassword"
          class="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover"
        >{{ loading() ? 'Guardando...' : 'Cambiar contraseña' }}</button>
        @if (!forced()) {
          <button (click)="close.emit()"
            class="px-6 py-2.5 rounded-lg font-medium text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
          >Cancelar</button>
        }
      </div>

      @if (error()) {
        <p class="text-sm text-red-500">{{ error() }}</p>
      }
    </div>
  </div>
</div>
  `,
})
export class ChangePassword {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  forced = input(false);
  close = output<void>();
  saved = output<void>();

  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  error = signal('');
  hasUpper = false;
  hasLower = false;
  hasNumber = false;
  hasSpecial = false;
  passwordValid = false;

  validate(): void {
    this.hasUpper = /[A-Z]/.test(this.newPassword);
    this.hasLower = /[a-z]/.test(this.newPassword);
    this.hasNumber = /\d/.test(this.newPassword);
    this.hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(this.newPassword);
    this.passwordValid = this.newPassword.length >= 8 && this.hasUpper && this.hasLower && this.hasNumber && this.hasSpecial;
  }

  onSubmit(): void {
    if (!this.passwordValid || this.newPassword !== this.confirmPassword) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.changePassword(this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Contraseña cambiada correctamente');
        this.saved.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Error al cambiar contraseña');
      },
    });
  }
}
