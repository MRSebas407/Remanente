import { Component, inject, Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _state = signal<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null);
  state = this._state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this._state.set({ options, resolve });
    });
  }

  close(result: boolean): void {
    const current = this._state();
    this._state.set(null);
    current?.resolve(result);
  }
}

@Component({
  selector: 'app-confirm',
  standalone: true,
  template: `
    @if (service.state(); as ctx) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/30" (click)="service.close(false)"></div>
        <div class="relative bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-semibold text-primary mb-2">{{ ctx.options.title }}</h3>
          <p class="text-sm text-secondary mb-6">{{ ctx.options.message }}</p>
          <div class="flex gap-3 justify-end">
            <button (click)="service.close(false)"
              class="px-4 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
            >{{ ctx.options.cancelText || 'Cancelar' }}</button>
            <button (click)="service.close(true)"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-red-600]="ctx.options.danger"
              [class.text-white]="ctx.options.danger"
              [class.hover:bg-red-700]="ctx.options.danger"
              [class.bg-primary]="!ctx.options.danger"
              [class.text-on-primary]="!ctx.options.danger"
              [class.hover:bg-primary-hover]="!ctx.options.danger"
            >{{ ctx.options.confirmText || 'Confirmar' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class Confirm {
  service = inject(ConfirmService);
}
