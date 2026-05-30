import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallService } from './call.service';
import { CallDetail, CallEntry } from './call.model';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-call-edit',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
      <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">Editar Llamada</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <form (ngSubmit)="onSave()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Persona</label>
              <p class="text-sm text-primary font-medium">{{ entry().person_name }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Llamada</label>
              <p class="text-sm text-primary">#{{ entry().call_number }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Asesor</label>
              <p class="text-sm text-primary">{{ entry().made_by_name }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Estado</label>
              <select [(ngModel)]="state" name="state"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                <option value="">Sin estado</option>
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

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Fecha programada</label>
              <input type="datetime-local" [(ngModel)]="scheduledDate" name="scheduledDate"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none" />
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
        }
      </div>
    </div>
  `,
})
export class CallEdit implements OnInit {
  private service = inject(CallService);
  private toast = inject(ToastService);

  entry = input.required<CallEntry>();
  close = output();
  saved = output();

  loading = signal(false);
  saving = signal(false);
  state = '';
  annotation = '';
  scheduledDate = '';

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getCallDetails(this.entry().call_id).subscribe({
      next: (details) => {
        const d = details[0];
        if (d) {
          this.state = d.state || '';
          this.annotation = d.annotation || '';
          this.scheduledDate = d.scheduled_date?.slice(0, 16) || '';
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar detalle');
        this.loading.set(false);
      },
    });
  }

  onSave(): void {
    this.saving.set(true);
    const payload: any = {};
    if (this.state) payload.state = this.state;
    else payload.state = null;
    payload.annotation = this.annotation || '';
    if (this.scheduledDate) payload.scheduled_date = new Date(this.scheduledDate).toISOString();
    this.service.updateCallDetail(this.entry().detail_id, payload).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: () => { this.saving.set(false); this.toast.error('Error al actualizar llamada'); },
    });
  }
}
