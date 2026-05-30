import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-slide-up flex items-start gap-2"
          [class.bg-green-50]="toast.type==='success'"
          [class.text-green-800]="toast.type==='success'"
          [class.border-green-200]="toast.type==='success'"
          [class.bg-red-50]="toast.type==='error'"
          [class.text-red-800]="toast.type==='error'"
          [class.border-red-200]="toast.type==='error'"
          [class.bg-blue-50]="toast.type==='info'"
          [class.text-blue-800]="toast.type==='info'"
          [class.border-blue-200]="toast.type==='info'"
          [class.bg-yellow-50]="toast.type==='warning'"
          [class.text-yellow-800]="toast.type==='warning'"
          [class.border-yellow-200]="toast.type==='warning'"
        >
          <span class="shrink-0 mt-0.5">
            @if (toast.type === 'success') { ✓ }
            @else if (toast.type === 'error') { ✕ }
            @else if (toast.type === 'warning') { ⚠ }
            @else { i }
          </span>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="shrink-0 opacity-60 hover:opacity-100">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from { transform: translateY(1rem); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-up { animation: slide-up 0.25s ease-out; }
  `],
})
export class Toast {
  toastService = inject(ToastService);
}
