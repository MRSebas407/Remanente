import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CallEntry } from './call.model';

@Component({
  selector: 'app-call-detail-view',
  standalone: true,
  imports: [DatePipe],
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden">
  <div class="bg-accent shadow-xl w-full max-w-lg mx-4 my-6 rounded-xl flex flex-col max-h-[calc(100vh-3rem)]" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">{{ call().person_name }} — Llamada #{{ call().call_number }}</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 overflow-y-auto flex-1 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Persona</label>
          <p class="text-primary font-medium">{{ call().person_name }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Llamada #</label>
          <p class="text-primary font-medium">{{ call().call_number }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Asesor</label>
          <p class="text-primary font-medium">{{ call().made_by_name }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Estado</label>
          <span class="inline-flex text-xs px-2 py-0.5 rounded-full font-medium"
            [class.bg-green-50]="call().state==='effective'" [class.text-green-700]="call().state==='effective'"
            [class.bg-red-50]="call().state==='not_effective'" [class.text-red-700]="call().state==='not_effective'"
            [class.bg-gray-100]="!call().state" [class.text-gray-600]="!call().state"
          >{{ stateLabel(call().state) }}</span>
        </div>
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Realizada</label>
          <p class="text-primary font-medium">{{ call().made ? 'Sí' : 'No' }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Fecha programada</label>
          <p class="text-primary font-medium">{{ call().scheduled_date | date:'dd/MM/yyyy HH:mm' }}</p>
        </div>
        @if (call().date_made) {
          <div>
            <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Fecha realizada</label>
            <p class="text-primary font-medium">{{ call().date_made | date:'dd/MM/yyyy HH:mm' }}</p>
          </div>
        }
      </div>

      @if (call().annotation) {
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Anotación</label>
          <p class="text-primary font-medium bg-accent-hover/20 rounded-lg p-3 border border-theme">{{ call().annotation }}</p>
        </div>
      }

      @if (call().signature) {
        <div>
          <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-1">Firma</label>
          <div class="max-w-xs rounded-lg border border-theme overflow-hidden bg-white p-2">
            <img [src]="call().signature" class="w-full h-auto block" />
          </div>
        </div>
      }
    </div>
    <div class="p-4 border-t border-theme flex justify-end">
      <button (click)="close.emit()" class="px-4 py-2 border border-theme rounded hover:bg-accent-hover transition-colors text-secondary text-sm">Cerrar</button>
    </div>
  </div>
</div>
  `,
})
export class CallDetailView {
  call = input.required<CallEntry>();
  close = output();

  stateLabel(v: string | null): string {
    return { effective: 'Efectivo', not_effective: 'No efectivo' }[v ?? ''] || 'Pendiente';
  }
}
