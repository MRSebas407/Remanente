import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PersonService } from './person.service';
import { PersonDetail } from './person.model';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [DatePipe],
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden">
  <div class="bg-accent shadow-xl w-full max-w-2xl mx-4 my-6 rounded-xl flex flex-col max-h-[calc(100vh-3rem)]" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">{{ detail()?.names }} {{ detail()?.lastname }}</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 overflow-y-auto flex-1">
      @if (loading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else if (detail(); as d) {
        <div class="space-y-6">
          @if (d.photo) {
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-1">Foto</label>
              <div class="max-w-xs rounded-lg border border-theme overflow-hidden">
                <img [src]="d.photo" class="w-full h-auto block" />
              </div>
            </div>
          }

          @if (d.signature) {
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-1">Firma</label>
              <div class="max-w-xs rounded-lg border border-theme overflow-hidden bg-white p-2">
                <img [src]="d.signature" class="w-full h-auto block" />
              </div>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Documento</label>
              <p class="text-primary font-medium">{{ d.document }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Teléfono</label>
              <p class="text-primary font-medium">{{ d.phone }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Género</label>
              <p class="text-primary font-medium">{{ d.gender === 'M' ? 'Masculino' : 'Femenino' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Especialidad</label>
              <p class="text-primary font-medium">{{ specialismLabel(d.specialism) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">País</label>
              <p class="text-primary font-medium">{{ d.country_name }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Ciudad</label>
              <p class="text-primary font-medium">{{ d.city_name }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Barrio</label>
              <p class="text-primary font-medium">{{ d.neighborhood_name }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Servicio</label>
              <p class="text-primary font-medium">{{ d.church_service_name }}</p>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Dirección</label>
              <p class="text-primary font-medium">{{ d.address || '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Estado de asignación</label>
              <p class="text-primary font-medium">{{ stateLabel(d.assignment_state) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Estado de miembro</label>
              <p class="text-primary font-medium">{{ d.member_state === 'effective' ? 'Efectivo' : 'No efectivo' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Padre espiritual</label>
              <p class="text-primary font-medium">{{ d.spiritual_father_name || '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Registrado por</label>
              <p class="text-primary font-medium">{{ d.registered_by_name }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Fundamentos</label>
              <p class="text-primary font-medium">{{ d.enrollment_fund_1 ? 'Inscrito' : 'No inscrito' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Bautizado</label>
              <p class="text-primary font-medium">{{ d.baptized ? 'Sí' : 'No' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Consentimiento de datos</label>
              <p class="text-primary font-medium">{{ d.data_consent ? 'Aceptado' : 'No aceptado' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Fecha de registro</label>
              <p class="text-primary font-medium">{{ d.register_date | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          @if (d.specialism === 'other_church' && d.comes_from_church) {
            <div class="border-t border-theme pt-4">
              <h3 class="text-sm font-medium text-primary mb-2">Procedencia</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Iglesia</label>
                  <p class="text-primary font-medium">{{ d.comes_from_church }}</p>
                </div>
                @if (d.comes_from_details) {
                  <div>
                    <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Detalles</label>
                    <p class="text-primary font-medium">{{ d.comes_from_details }}</p>
                  </div>
                }
              </div>
            </div>
          }
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
export class PersonDetailComponent implements OnInit {
  private service = inject(PersonService);

  personId = input.required<number>();
  close = output();

  detail = signal<PersonDetail | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.service.get(this.personId()).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  specialismLabel(v: string): string {
    return { joven: 'Joven', normal: 'Normal', other_church: 'Otra Iglesia', distance: 'Distancia' }[v] || v;
  }

  stateLabel(v: string): string {
    return { pending: 'Pendiente', assigned: 'Asignado', completed: 'Completado' }[v] || v;
  }
}
