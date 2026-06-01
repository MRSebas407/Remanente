import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { AdviserService } from './adviser.service';
import { AdviserDetail, Role } from './adviser.model';

@Component({
  selector: 'app-adviser-detail',
  standalone: true,
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden">
  <div class="bg-accent shadow-xl w-full max-w-2xl mx-4 my-6 rounded-xl flex flex-col max-h-[calc(100vh-3rem)]" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">{{ detail()?.profile?.names }} {{ detail()?.profile?.last_name }}</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 overflow-y-auto flex-1">
      @if (loading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else if (detail(); as d) {
        <div class="space-y-6">
          @if (d.profile.photo) {
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-1">Foto</label>
              <div class="max-w-xs rounded-lg border border-theme overflow-hidden">
                <img [src]="d.profile.photo" class="w-full h-auto block" />
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
              <p class="text-primary font-medium">{{ d.profile.document }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Teléfono</label>
              <p class="text-primary font-medium">{{ d.profile.phone }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Género</label>
              <p class="text-primary font-medium">{{ d.profile.gender === 'M' ? 'Masculino' : 'Femenino' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Rol</label>
              <p class="text-primary font-medium">{{ roleNames(d.roles) }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Especialidad</label>
              <p class="text-primary font-medium">{{ d.specialism?.name || '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Asignados</label>
              <p class="text-primary font-medium">{{ d.assigned_count }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide">Estado</label>
              <span class="inline-flex text-xs px-2 py-0.5 rounded-full font-medium"
                [class.bg-green-50]="d.is_active" [class.text-green-700]="d.is_active"
                [class.bg-red-50]="!d.is_active" [class.text-red-700]="!d.is_active"
              >{{ d.is_active ? 'Activo' : 'Inactivo' }}</span>
            </div>
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
export class AdviserDetailComponent implements OnInit {
  private service = inject(AdviserService);

  adviserId = input.required<number>();
  close = output();

  detail = signal<AdviserDetail | null>(null);
  loading = signal(false);

  roleNames(roles: Role[]): string {
    return roles.map(r => r.name).join(', ');
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.service.get(this.adviserId()).subscribe({
      next: (d) => { this.detail.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
