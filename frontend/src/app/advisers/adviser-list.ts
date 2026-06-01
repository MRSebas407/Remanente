import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdviserService } from './adviser.service';
import { AdviserListEntry, Role } from './adviser.model';
import { AdviserEdit } from './adviser-edit';
import { AdviserCreate } from './adviser-create';
import { AdviserDetailComponent } from './adviser-detail';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm';

@Component({
  selector: 'app-adviser-list',
  standalone: true,
  imports: [FormsModule, AdviserEdit, AdviserCreate, AdviserDetailComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-primary">Listado de Asesores</h2>
        <button (click)="openCreate()"
          class="text-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors"
        >+ Nuevo Asesor</button>
      </div>

      <div class="bg-accent rounded-xl border border-theme overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-theme bg-secondary">
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Nombre</span>
                <input [(ngModel)]="filters.name" (input)="onFilterChange()"
                  placeholder="Filtrar..."
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
              </th>
              <th class="px-3 py-2 text-left hidden sm:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Rol</span>
                <select [(ngModel)]="filters.role_name" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                  <option value="">Todos</option>
                  @for (r of roles; track r.id) {
                    <option [value]="r.name">{{ r.name }}</option>
                  }
                </select>
              </th>
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Cédula</span>
                <input [(ngModel)]="filters.document" (input)="onFilterChange()"
                  placeholder="Filtrar..."
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
              </th>
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Teléfono</span>
                <input [(ngModel)]="filters.phone" (input)="onFilterChange()"
                  placeholder="Filtrar..."
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
              </th>
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Estado</span>
                <select [(ngModel)]="filters.is_active" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </th>
              <th class="px-3 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <span class="text-xs font-medium text-secondary uppercase tracking-wide">Acciones</span>
                  @if (hasActiveFilters()) {
                    <button (click)="clearFilters()" title="Limpiar filtros"
                      class="ml-1 text-xs text-red-500 hover:text-red-700 underline">Limpiar</button>
                  }
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            @if (advisers().length === 0 && !loading()) {
              <tr><td colspan="6" class="text-center py-8 text-secondary">No se encontraron asesores</td></tr>
            }
            @if (advisers().length === 0 && loading()) {
              <tr><td colspan="6" class="text-center py-8 text-secondary">
                <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </td></tr>
            }
              @for (a of advisers(); track a.id) {
                <tr class="border-b border-theme/50 hover:bg-accent-hover/30 transition-colors">
                  <td class="px-3 py-3 text-primary font-medium">{{ a.full_name }}</td>
                  <td class="px-3 py-3 text-secondary hidden sm:table-cell">{{ a.roles.map(r => r.name).join(', ') }}</td>
                  <td class="px-3 py-3 text-secondary hidden md:table-cell font-mono">{{ a.document }}</td>
                  <td class="px-3 py-3 text-secondary hidden md:table-cell font-mono">{{ a.phone }}</td>
                  <td class="px-3 py-3">
                    <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      [class.bg-green-50]="a.is_active" [class.text-green-700]="a.is_active" [class.border]="a.is_active" [class.border-green-200]="a.is_active"
                      [class.bg-red-50]="!a.is_active" [class.text-red-700]="!a.is_active" [class.border]="!a.is_active" [class.border-red-200]="!a.is_active"
                    >
                      {{ a.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-right whitespace-nowrap">
                    <button (click)="openDetail(a.id)" title="Ver detalle"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    @if (!a.is_active) {
                      <button (click)="confirmActivate(a)" title="Activar"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 transition-colors text-green-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </button>
                    } @else {
                      <button (click)="openEdit(a.id)" title="Editar"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="confirmResetPassword(a)" title="Restablecer contraseña"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-orange-50 transition-colors text-orange-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                      </button>
                      <button (click)="confirmDeactivate(a)" title="Desactivar"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 transition-colors text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
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
            <span>{{ totalItems }} asesores</span>
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
              class="px-3 py-1.5 rounded-lg border border-theme text-xs disabled:opacity-30 hover:bg-accent-hover transition-colors"
            >Anterior</button>
            <span class="text-xs">Pág {{ page }} de {{ totalPages }}</span>
            <button (click)="nextPage()" [disabled]="page >= totalPages"
              class="px-3 py-1.5 rounded-lg border border-theme text-xs disabled:opacity-30 hover:bg-accent-hover transition-colors"
            >Siguiente</button>
          </div>
        </div>
    </div>

    @if (detailModalOpen()) {
      <app-adviser-detail [adviserId]="detailAdviserId()" (close)="detailModalOpen.set(false)" />
    }

    @if (editModalOpen()) {
      <app-adviser-edit [adviserId]="editAdviserId" (close)="closeEdit()" (saved)="onEditSaved()" />
    }

    @if (createModalOpen()) {
      <app-adviser-create (close)="closeCreate()" (saved)="onCreateSaved()" />
    }
  `,
})
export class AdviserList implements OnInit {
  private service = inject(AdviserService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  advisers = signal<AdviserListEntry[]>([]);
  roles: Role[] = [];
  loading = signal(false);
  page = 1;
  totalItems = 0;
  totalPages = 0;
  pageSize = 10;

  filters = {
    name: '',
    document: '',
    phone: '',
    role_name: '',
    is_active: '',
  };

  detailModalOpen = signal(false);
  detailAdviserId = signal(0);
  editModalOpen = signal(false);
  editAdviserId = 0;
  createModalOpen = signal(false);

  private filterTimeout: any;

  ngOnInit(): void {
    this.service.getRoles().subscribe({ next: (r) => { this.roles = r; } });
    this.loadPage(1);
  }

  onFilterChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => this.loadPage(1), 300);
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.name || this.filters.document || this.filters.phone || this.filters.role_name || this.filters.is_active);
  }

  clearFilters(): void {
    this.filters = { name: '', document: '', phone: '', role_name: '', is_active: '' };
    this.loadPage(1);
  }

  loadPage(p: number): void {
    this.page = p;
    const isFirstLoad = this.advisers().length === 0;
    if (isFirstLoad) this.loading.set(true);
    this.service.list({
      name: this.filters.name || undefined,
      document: this.filters.document || undefined,
      phone: this.filters.phone || undefined,
      role_name: this.filters.role_name || undefined,
      is_active: this.filters.is_active || undefined,
      page: this.page,
      page_size: this.pageSize || 99999,
    }).subscribe({
      next: (res) => {
        this.advisers.set(res.results);
        this.totalItems = res.count;
        this.totalPages = this.pageSize > 0 ? Math.ceil(res.count / this.pageSize) : 1;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageSizeChange(): void {
    this.loadPage(1);
  }

  prevPage(): void {
    if (this.page > 1) this.loadPage(this.page - 1);
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.loadPage(this.page + 1);
  }

  openCreate(): void {
    this.createModalOpen.set(true);
  }

  closeCreate(): void {
    this.createModalOpen.set(false);
  }

  onCreateSaved(): void {
    this.closeCreate();
    this.toast.success('Asesor registrado correctamente');
    this.loadPage(1);
  }

  async confirmDeactivate(a: AdviserListEntry): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Desactivar asesor',
      message: `¿Estás seguro de desactivar a ${a.full_name}?`,
      confirmText: 'Desactivar',
      danger: true,
    });
    if (!ok) return;
    this.service.deactivate(a.id).subscribe({
      next: (res: any) => {
        const msg = `${a.full_name} desactivado`;
        const extra = [];
        if (res.reassigned > 0) extra.push(`${res.reassigned} reasignada(s)`);
        if (res.pending > 0) extra.push(`${res.pending} pendiente(s)`);
        this.toast.success(extra.length ? `${msg} — ${extra.join(', ')}` : msg);
        this.loadPage(this.page);
      },
    });
  }

  async confirmActivate(a: AdviserListEntry): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Activar asesor',
      message: `¿Estás seguro de activar a ${a.full_name}?`,
      confirmText: 'Activar',
    });
    if (!ok) return;
    this.service.activate(a.id).subscribe({
      next: () => {
        this.toast.success(`${a.full_name} activado`);
        this.loadPage(this.page);
      },
    });
  }

  async confirmResetPassword(a: AdviserListEntry): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Restablecer contraseña',
      message: `¿Restablecer contraseña de ${a.full_name} a su cédula (${a.document})?`,
      confirmText: 'Restablecer',
      danger: false,
    });
    if (!ok) return;
    this.service.resetPassword(a.id).subscribe({
      next: (res: any) => {
        this.toast.success(res.message || 'Contraseña restablecida');
      },
      error: () => this.toast.error('Error al restablecer contraseña'),
    });
  }

  openDetail(id: number): void {
    this.detailAdviserId.set(id);
    this.detailModalOpen.set(true);
  }

  openEdit(id: number): void {
    this.editAdviserId = id;
    this.editModalOpen.set(true);
  }

  closeEdit(): void {
    this.editModalOpen.set(false);
  }

  onEditSaved(): void {
    this.closeEdit();
    this.toast.success('Asesor actualizado correctamente');
    this.loadPage(this.page);
  }
}
