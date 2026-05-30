import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallService } from './call.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-call-detail',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
      <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">Registrar Llamada</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        <form (ngSubmit)="onSave()" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Persona</label>
            <p class="text-sm text-primary font-medium">{{ personName() }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Llamada</label>
            <p class="text-sm text-primary">#{{ callNumber() }}</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Estado</label>
            <select [(ngModel)]="state" name="state" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="effective">Efectivo</option>
              <option value="not_effective">No Efectivo</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Anotación</label>
            <textarea [(ngModel)]="annotation" name="annotation" rows="3"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none resize-none"
              placeholder="Comentarios..."></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" [disabled]="saving()"
              class="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
            >{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
            <button type="button" (click)="close.emit()"
              class="px-5 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
            >Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CallDetail {
  private service = inject(CallService);
  private toast = inject(ToastService);

  callId = input.required<number>();
  personName = input.required<string>();
  callNumber = input.required<number>();
  close = output();
  saved = output();

  state = 'effective';
  annotation = '';
  saving = signal(false);

  onSave(): void {
    this.saving.set(true);
    const fd = new FormData();
    fd.append('state', this.state);
    fd.append('annotation', this.annotation);
    this.service.recordCall(this.callId(), fd).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: () => { this.saving.set(false); this.toast.error('Error al registrar llamada'); },
    });
  }
}
