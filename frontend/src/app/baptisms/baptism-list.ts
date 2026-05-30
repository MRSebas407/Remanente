import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BaptismService } from './baptism.service';
import { BaptismRegister } from './baptism.model';
import { BaptismForm } from './baptism-form';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm';

@Component({
  selector: 'app-baptism-list',
  standalone: true,
  imports: [FormsModule, DatePipe, BaptismForm],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-primary">Registros de Bautizo</h2>
        <button (click)="openCreate()"
          class="text-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors"
        >+ Nuevo Registro</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-accent rounded-xl border border-theme p-3">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Total</p>
          <p class="text-2xl font-bold text-primary mt-0.5">{{ totalItems }}</p>
        </div>
        <div class="bg-accent rounded-xl border border-theme p-3">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Pendientes</p>
          <p class="text-2xl font-bold text-amber-600 mt-0.5">{{ stats()?.pending_baptism ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border border-theme p-3">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Inscritos</p>
          <p class="text-2xl font-bold text-blue-600 mt-0.5">{{ stats()?.registered_baptism ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border border-theme p-3">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Bautizados</p>
          <p class="text-2xl font-bold text-green-600 mt-0.5">{{ stats()?.baptized_baptism ?? baptizedTotal() }}</p>
        </div>
      </div>

      <div class="bg-accent rounded-xl border border-theme overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-theme bg-secondary">
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Persona</span>
                <input [(ngModel)]="filters.name" (input)="onFilterChange()"
                  placeholder="Filtrar..."
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
              </th>
              @if (isAdmin) {
                <th class="px-3 py-2 text-left hidden md:table-cell">
                  <span class="text-xs font-medium text-secondary uppercase tracking-wide">Maestro</span>
                </th>
              }
              <th class="px-3 py-2 text-left hidden sm:table-cell w-16">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Edad</span>
              </th>
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Decisión</span>
                <select [(ngModel)]="filters.decision" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
                  <option value="">Todos</option>
                  <option value="yes">Sí</option>
                  <option value="no">No</option>
                  <option value="undecided">Indeciso</option>
                </select>
              </th>
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Estado</span>
                <select [(ngModel)]="filters.baptized" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
                  <option value="">Todos</option>
                  <option value="false">Pendiente</option>
                  <option value="true">Bautizado</option>
                </select>
              </th>
              <th class="px-3 py-2 text-right">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @if (registers().length === 0 && !loading()) {
              <tr><td colspan="7" class="text-center py-8 text-secondary">No hay registros de bautizo</td></tr>
            }
            @if (registers().length === 0 && loading()) {
              <tr><td colspan="7" class="text-center py-8 text-secondary">
                <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </td></tr>
            }
            @for (r of registers(); track r.id) {
              <tr class="border-b border-theme/50 hover:bg-accent-hover/30 transition-colors">
                <td class="px-3 py-3">
                  <span class="text-primary font-medium">{{ r.person_name }}</span>
                </td>
                @if (isAdmin) {
                  <td class="px-3 py-3 text-secondary hidden md:table-cell text-xs">{{ r.teacher_name }}</td>
                }
                <td class="px-3 py-3 text-secondary hidden sm:table-cell">{{ r.age }}</td>
                <td class="px-3 py-3 text-secondary hidden md:table-cell text-xs">{{ decisionLabel(r.baptism_decision) }}</td>
                <td class="px-3 py-3">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    [class.bg-green-100]="r.baptized" [class.text-green-700]="r.baptized"
                    [class.bg-amber-100]="!r.baptized" [class.text-amber-700]="!r.baptized"
                  >{{ r.baptized ? 'Bautizado' : 'Pendiente' }}</span>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                  <button (click)="openDetail(r)" title="Ver detalle"
                    class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-cyan-50 transition-colors text-cyan-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button (click)="openEdit(r)" title="Editar"
                    class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  @if (isAdmin) {
                    <button (click)="confirmDelete(r)" title="Eliminar"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 transition-colors text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between text-sm text-secondary">
        <div class="flex items-center gap-2">
          <span>{{ totalItems }} registros</span>
          <select [(ngModel)]="pageSize" (change)="onPageSizeChange()"
            class="px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="15">15</option>
            <option [value]="0">Todos</option>
          </select>
        </div>
        <div class="flex gap-2 items-center">
          <button (click)="prevPage()" [disabled]="page === 1"
            class="px-3 py-1.5 rounded-lg border border-theme text-xs disabled:opacity-30 hover:bg-accent-hover transition-colors">Anterior</button>
          <span class="text-xs">Pág {{ page }} de {{ totalPages }}</span>
          <button (click)="nextPage()" [disabled]="page >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-theme text-xs disabled:opacity-30 hover:bg-accent-hover transition-colors">Siguiente</button>
        </div>
      </div>
    </div>

    @if (showForm()) {
      <app-baptism-form [registerId]="editId()" (close)="showForm.set(false)" (saved)="onSaved()" />
    }

    @if (detailItem(); as d) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="detailItem.set(null)">
        <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-primary">Detalle de Bautizo</h3>
            <button (click)="detailItem.set(null)" class="text-secondary hover:text-primary text-xl">&times;</button>
          </div>
          <div class="space-y-3 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-secondary">Persona</p>
                <p class="text-primary font-medium">{{ d.person_name }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Maestro</p>
                <p class="text-primary">{{ d.teacher_name }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Edad</p>
                <p class="text-primary">{{ d.age ?? '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Decisión</p>
                <p class="text-primary">{{ decisionLabel(d.baptism_decision) }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Estado</p>
                <p class="text-primary">{{ d.baptized ? 'Bautizado' : 'Pendiente' }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Fecha registro</p>
                <p class="text-primary">{{ d.registration_date | date:'short' }}</p>
              </div>
            </div>
            <div>
              <p class="text-xs text-secondary">Acudiente</p>
              <p class="text-primary">{{ d.attendant_name || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-secondary">Clase</p>
              <p class="text-primary">{{ d.class_info ? d.class_info.calendar + ' — ' + d.class_info.mode : '—' }}</p>
            </div>
            @if (d.photo) {
              <div>
                <p class="text-xs text-secondary mb-1">Foto</p>
                <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                  <img [src]="d.photo" class="w-full h-auto block" />
                </div>
              </div>
            }
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-secondary">Talla camiseta</p>
                <p class="text-primary">{{ d.shirt_size || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-secondary">Tiempo en iglesia</p>
                <p class="text-primary">{{ d.time_in_church || '—' }}</p>
              </div>
            </div>
            <div>
              <p class="text-xs text-secondary">Detalles</p>
              <p class="text-primary whitespace-pre-wrap">{{ d.details || '—' }}</p>
            </div>
          </div>
          <button (click)="detailItem.set(null)" class="mt-4 w-full px-4 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary">Cerrar</button>
        </div>
      </div>
    }
  `,
})
export class BaptismList implements OnInit {
  private service = inject(BaptismService);
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private route = inject(ActivatedRoute);

  isAdmin = this.auth.getUserRole() === 'Administrador';
  registers = signal<BaptismRegister[]>([]);
  stats = signal<any>(null);
  loading = signal(false);
  showForm = signal(false);
  editId = signal<number | null>(null);
  detailItem = signal<BaptismRegister | null>(null);

  page = 1;
  totalItems = 0;
  totalPages = 0;
  pageSize = 10;

  filters = { name: '', decision: '', baptized: '' };
  private filterTimeout: any;

  ngOnInit(): void {
    this.dashboardService.getMyStats().subscribe({ next: (r) => this.stats.set(r) });
    this.route.queryParams.subscribe(params => {
      if (params['name']) this.filters.name = params['name'];
      this.loadPage(1);
    });
  }

  loadPage(p: number): void {
    this.page = p;
    const isFirst = this.registers().length === 0;
    if (isFirst) this.loading.set(true);
    const params: any = {};
    if (this.filters.name) params.name = this.filters.name;
    if (this.filters.decision) params.decision = this.filters.decision;
    if (this.filters.baptized) params.baptized = this.filters.baptized;
    params.page = p;
    if (this.pageSize > 0) params.page_size = this.pageSize;
    this.service.list(params).subscribe({
      next: (res) => {
        this.registers.set(res.results);
        this.totalItems = res.count;
        this.totalPages = Math.ceil(res.count / (this.pageSize > 0 ? this.pageSize : 1));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => this.loadPage(1), 300);
  }

  onPageSizeChange(): void {
    this.loadPage(1);
  }

  prevPage(): void { if (this.page > 1) this.loadPage(this.page - 1); }
  nextPage(): void { if (this.page < this.totalPages) this.loadPage(this.page + 1); }

  decisionLabel(v: string): string {
    return { yes: 'Sí', no: 'No', undecided: 'Indeciso' }[v] || v;
  }

  baptizedTotal(): number {
    return this.registers().filter(r => r.baptized).length;
  }

  openCreate(): void { this.editId.set(null); this.showForm.set(true); }
  openEdit(r: BaptismRegister): void { this.editId.set(r.id); this.showForm.set(true); }
  openDetail(r: BaptismRegister): void { this.detailItem.set(r); }

  onSaved(): void {
    this.showForm.set(false);
    this.toast.success('Registro guardado');
    this.loadPage(this.page);
  }

  async confirmDelete(r: BaptismRegister): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar registro',
      message: `¿Eliminar registro de ${r.person_name}?`,
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    this.service.delete(r.id).subscribe({
      next: () => { this.toast.success('Registro eliminado'); this.loadPage(this.page); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }
}
