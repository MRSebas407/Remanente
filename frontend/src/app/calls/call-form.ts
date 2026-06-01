import { Component, inject, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CallService } from './call.service';
import { PersonService } from '../persons/person.service';
import { PersonListEntry } from '../persons/person.model';
import { AdviserService } from '../advisers/adviser.service';
import { AdviserListEntry, Role } from '../advisers/adviser.model';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-call-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">Nueva Llamada</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        <form (ngSubmit)="onSave()" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Persona <span class="text-red-500">*</span></label>
            <select [(ngModel)]="personId" name="personId" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (p of persons; track p.id) {
                <option [value]="p.id">{{ p.names }} {{ p.lastname }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Llamada # <span class="text-red-500">*</span></label>
            <select [(ngModel)]="callNumber" name="callNumber" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              <option value="1">#1 - Primera</option>
              <option value="2">#2 - Segunda</option>
              <option value="3">#3 - Tercera</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Asesor <span class="text-red-500">*</span></label>
            <select [(ngModel)]="madeById" name="madeById" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (a of advisers; track a.id) {
                <option [value]="a.id">{{ a.full_name }} ({{ roleNames(a.roles) }})</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-primary mb-0.5">Fecha programada <span class="text-red-500">*</span></label>
            <input type="datetime-local" [(ngModel)]="scheduledDate" name="scheduledDate" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" [disabled]="saving()"
              class="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
            >{{ saving() ? 'Guardando...' : 'Crear' }}</button>
            <button type="button" (click)="close.emit()"
              class="px-5 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
            >Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class CallForm implements OnInit {
  private callService = inject(CallService);
  private personService = inject(PersonService);
  private adviserService = inject(AdviserService);
  private toast = inject(ToastService);

  close = output();
  saved = output();

  persons: PersonListEntry[] = [];
  advisers: AdviserListEntry[] = [];
  personId = '';
  callNumber = '';
  madeById = '';
  scheduledDate = '';
  saving = signal(false);

  roleNames(roles: Role[]): string {
    return roles.map(r => r.name).join(', ');
  }

  ngOnInit(): void {
    this.personService.list({ page: 1 }).subscribe({
      next: (res) => { this.persons = res.results; },
    });
    this.adviserService.list({}).subscribe({
      next: (res) => { this.advisers = res.results; },
    });
  }

  onSave(): void {
    if (!this.personId || !this.callNumber || !this.madeById || !this.scheduledDate) {
      this.toast.error('Todos los campos son obligatorios');
      return;
    }
    this.saving.set(true);
    this.callService.createCall({
      person: Number(this.personId),
      call_number: Number(this.callNumber),
      made_by: Number(this.madeById),
      scheduled_date: new Date(this.scheduledDate).toISOString(),
    }).subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: () => { this.saving.set(false); this.toast.error('Error al crear llamada'); },
    });
  }
}
