import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallService } from './call.service';
import { CallEntry, PendingCall } from './call.model';
import { CallDetail } from './call-detail';
import { CallDetailView } from './call-detail-view';
import { CallEdit } from './call-edit';
import { CallForm } from './call-form';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Component({
  selector: 'app-call-list',
  standalone: true,
  imports: [DatePipe, NgClass, FormsModule, CallDetail, CallDetailView, CallEdit, CallForm],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-primary">
          {{ isAdmin ? 'Todas las Llamadas' : 'Mis Llamadas' }}
        </h2>
        @if (isAdmin) {
          <button (click)="showForm.set(true)"
            class="text-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors"
          >+ Nueva Llamada</button>
        }
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div class="bg-accent rounded-xl border p-3 cursor-pointer transition-all"
          [class.opacity-40]="(stats()?.pending_calls ?? 0) === 0"
          [class.border-primary]="activeFilter() === 'pending'"
          [class.border-theme]="activeFilter() !== 'pending'"
          (click)="toggleFilter('pending')">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Pendientes</p>
          <p class="text-2xl font-bold text-amber-600 mt-0.5">{{ stats()?.pending_calls ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border p-3 cursor-pointer transition-all"
          [class.opacity-40]="(stats()?.expired_calls ?? 0) === 0"
          [class.border-primary]="activeFilter() === 'expired'"
          [class.border-theme]="activeFilter() !== 'expired'"
          (click)="toggleFilter('expired')">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Vencidas</p>
          <p class="text-2xl font-bold text-red-600 mt-0.5">{{ stats()?.expired_calls ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border p-3 cursor-pointer transition-all"
          [class.opacity-40]="(stats()?.made_calls ?? 0) === 0"
          [class.border-primary]="activeFilter() === 'made'"
          [class.border-theme]="activeFilter() !== 'made'"
          (click)="toggleFilter('made')">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Realizadas</p>
          <p class="text-2xl font-bold text-green-600 mt-0.5">{{ stats()?.made_calls ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border p-3 cursor-pointer transition-all"
          [class.opacity-40]="(stats()?.effective_calls ?? 0) === 0"
          [class.border-primary]="activeFilter() === 'effective'"
          [class.border-theme]="activeFilter() !== 'effective'"
          (click)="toggleFilter('effective')">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">Efectivas</p>
          <p class="text-2xl font-bold text-green-600 mt-0.5">{{ stats()?.effective_calls ?? 0 }}</p>
        </div>
        <div class="bg-accent rounded-xl border p-3 cursor-pointer transition-all"
          [class.opacity-40]="(stats()?.not_effective_calls ?? 0) === 0"
          [class.border-primary]="activeFilter() === 'not_effective'"
          [class.border-theme]="activeFilter() !== 'not_effective'"
          (click)="toggleFilter('not_effective')">
          <p class="text-xs text-secondary uppercase tracking-wide font-medium">No Efectivas</p>
          <p class="text-2xl font-bold text-red-600 mt-0.5">{{ stats()?.not_effective_calls ?? 0 }}</p>
        </div>
      </div>

      @if (pendingCalls().length > 0) {
        <div class="bg-accent rounded-xl border border-theme p-4">
          <h3 class="text-sm font-semibold text-primary mb-3">Llamadas Pendientes</h3>
          <div class="space-y-2">
            @for (c of pendingCalls(); track c.detail_id) {
              <div class="flex items-center gap-3 p-2 rounded-lg border border-theme/50 cursor-pointer hover:bg-accent-hover transition-colors" (click)="filterByPerson(c)">
                <span class="inline-block w-3 h-3 rounded-full shrink-0"
                  [class.bg-green-500]="callColor(c)==='green'"
                  [class.bg-yellow-400]="callColor(c)==='yellow'"
                  [class.bg-orange-400]="callColor(c)==='orange'"
                  [class.bg-red-500]="callColor(c)==='red'"
                ></span>
                <span class="flex-1 text-sm text-primary">{{ c.person_name }}</span>
                <span class="text-xs text-secondary">#{{ c.call_number }}</span>
                <span class="text-xs font-medium"
                  [class.text-green-600]="callColor(c)==='green'"
                  [class.text-yellow-600]="callColor(c)==='yellow'"
                  [class.text-orange-600]="callColor(c)==='orange'"
                  [class.text-red-600]="callColor(c)==='red'"
                >{{ remainingFromDate(c.scheduled_date) }}</span>
              </div>
            }
          </div>
        </div>
      }
      @if (expiredCalls().length > 0) {
        <div class="bg-accent rounded-xl border border-red-200 dark:border-red-800 p-4">
          <h3 class="text-sm font-semibold text-red-600 mb-3">Llamadas Vencidas</h3>
          <div class="space-y-2">
            @for (c of expiredCalls(); track c.detail_id) {
              <div class="flex items-center gap-3 p-2 rounded-lg border border-red-100 dark:border-red-900 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" (click)="filterByEntry(c)">
                <span class="inline-block w-3 h-3 rounded-full shrink-0 bg-red-500"></span>
                <span class="flex-1 text-sm text-primary">{{ c.person_name }}</span>
                <span class="text-xs text-secondary">#{{ c.call_number }}</span>
              </div>
            }
          </div>
        </div>
      }

      <div class="bg-accent rounded-xl border border-theme overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-theme bg-secondary">
              <th class="px-3 py-2 text-left w-6">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">#</span>
              </th>
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Persona</span>
                <input [(ngModel)]="filters.name" (input)="onFilterChange()"
                  placeholder="Filtrar..."
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
              </th>
              @if (isAdmin) {
                <th class="px-3 py-2 text-left hidden md:table-cell">
                  <span class="text-xs font-medium text-secondary uppercase tracking-wide">Asesor</span>
                  <input [(ngModel)]="filters.made_by" (input)="onFilterChange()"
                    placeholder="Filtrar..."
                    class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                </th>
              }
              <th class="px-3 py-2 text-left hidden sm:table-cell w-12">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">#</span>
              </th>
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Programada</span>
              </th>
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Realizada</span>
              </th>
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Estado</span>
                <select [(ngModel)]="filters.state" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="expired">Vencida</option>
                  <option value="made">Realizada</option>
                  <option value="effective">Efectivo</option>
                  <option value="not_effective">No Efectivo</option>
                </select>
              </th>
              <th class="px-3 py-2 text-right">
                <div class="flex items-center justify-end gap-1">
                  <span class="text-xs font-medium text-secondary uppercase tracking-wide">Acción</span>
                  @if (hasActiveFilters()) {
                    <button (click)="clearFilters()" title="Limpiar filtros"
                      class="ml-1 text-xs text-red-500 hover:text-red-700 underline">Limpiar</button>
                  }
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            @if (calls().length === 0 && !loading()) {
              <tr><td colspan="8" class="text-center py-8 text-secondary">No hay llamadas</td></tr>
            }
            @if (calls().length === 0 && loading()) {
              <tr><td colspan="8" class="text-center py-8 text-secondary">
                <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </td></tr>
            }
            @for (c of calls(); track c.detail_id) {
              <tr class="border-b border-theme/50 transition-colors"
                [ngClass]="{
                  'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30': !c.made,
                  'hover:bg-accent-hover/30': c.made
                }"
              >
                <td class="px-3 py-3">
                  <span class="inline-block w-3 h-3 rounded-full"
                    [class.bg-green-500]="callColor(c)==='green'"
                    [class.bg-yellow-400]="callColor(c)==='yellow'"
                    [class.bg-orange-400]="callColor(c)==='orange'"
                    [class.bg-red-500]="callColor(c)==='red'"
                  ></span>
                </td>
                <td class="px-3 py-3">
                  <span class="text-primary font-medium">{{ c.person_name }}</span>
                </td>
                @if (isAdmin) {
                  <td class="px-3 py-3 text-secondary hidden md:table-cell text-xs">{{ c.made_by_name }}</td>
                }
                <td class="px-3 py-3 text-secondary hidden sm:table-cell">#{{ c.call_number }}</td>
                <td class="px-3 py-3 text-secondary hidden md:table-cell">{{ c.scheduled_date | date:'dd/MM/yy HH:mm' }}</td>
                <td class="px-3 py-3 text-secondary hidden md:table-cell">
                  @if (c.date_made) {
                    {{ c.date_made | date:'dd/MM/yy HH:mm' }}
                  } @else {
                    <span class="text-xs text-red-500">—</span>
                  }
                </td>
                <td class="px-3 py-3">
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                    [ngClass]="{
                      'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400': c.state==='effective',
                      'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400': c.state==='not_effective',
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400': !c.made
                    }"
                  >{{ stateLabel(c) }}</span>
                </td>
                <td class="px-3 py-3 text-right whitespace-nowrap">
                    <button (click)="viewDetail(c)" title="Ver detalle"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    @if (!c.made) {
                    <button (click)="openDetail(c)" title="Registrar llamada"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </button>
                    }
                    @if (isAdmin) {
                    <button (click)="openEdit(c)" title="Editar"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
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
          <span>{{ totalItems }} llamadas</span>
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

    @if (selectedCall(); as c) {
      <app-call-detail
        [callId]="c.call_id"
        [personName]="c.person_name"
        [callNumber]="c.call_number"
        (close)="selectedCall.set(null)"
        (saved)="onCallSaved()"
      />
    }

    @if (detailCall(); as c) {
      <app-call-detail-view [call]="c" (close)="detailCall.set(null)" />
    }

    @if (showForm()) {
      <app-call-form (close)="showForm.set(false)" (saved)="onCallCreated()" />
    }

    @if (editCall(); as c) {
      <app-call-edit [entry]="c" (close)="editCall.set(null)" (saved)="onEditSaved()" />
    }
  `,
})
export class CallList implements OnInit, OnDestroy {
  private service = inject(CallService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  isAdmin = this.auth.isAdmin();
  calls = signal<CallEntry[]>([]);
  loading = signal(false);
  selectedCall = signal<CallEntry | null>(null);
  detailCall = signal<CallEntry | null>(null);
  showForm = signal(false);
  editCall = signal<CallEntry | null>(null);

  stats = signal<any>(null);
  pendingCalls = signal<PendingCall[]>([]);
  expiredCalls = signal<CallEntry[]>([]);
  tick = signal(0);
  activeFilter = signal('');
  filters = { name: '', made_by: '', state: '' };
  totalItems = 0;
  totalPages = 0;
  page = 1;
  pageSize = 0;
  private filterTimeout: any;
  private timerInterval: any;
  private refreshInterval: any;

  ngOnInit(): void {
    this.timerInterval = setInterval(() => this.tick.set(this.tick() + 1), 1000);
    this.refreshInterval = setInterval(() => this.loadStats(), 30000);
    this.route.queryParams.subscribe(params => {
      if (params['name']) {
        this.filters.name = params['name'];
      }
      this.loadStats();
      this.loadPage(1);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
    clearInterval(this.refreshInterval);
  }

  filterByPerson(c: PendingCall): void {
    this.filters.name = c.person_name;
    this.loadPage(1);
  }

  filterByEntry(c: CallEntry): void {
    this.filters.name = c.person_name;
    this.loadPage(1);
  }

  toggleFilter(key: string): void {
    if (this.stats() !== null) {
      const counts: Record<string, number> = {
        pending: this.stats()?.pending_calls ?? 0,
        expired: this.stats()?.expired_calls ?? 0,
        made: this.stats()?.made_calls ?? 0,
        effective: this.stats()?.effective_calls ?? 0,
        not_effective: this.stats()?.not_effective_calls ?? 0,
      };
      if (counts[key] === 0) return;
    }
    if (this.activeFilter() === key) {
      this.activeFilter.set('');
      this.filters.state = '';
    } else {
      this.activeFilter.set(key);
      this.filters.state = key;
    }
    this.loadPage(1);
  }

  private loadStats(): void {
    this.dashboardService.getMyStats().subscribe({
      next: (res) => { this.stats.set(res); },
    });
    this.service.getPendingCalls().subscribe({
      next: (res) => { this.pendingCalls.set(res); },
    });
    const now = new Date();
    this.service.getAllCalls({ state: 'pending', page_size: 99999 }).subscribe({
      next: (res) => {
        this.expiredCalls.set(res.results.filter(c => !c.made && new Date(c.scheduled_date) < now));
      },
    });
  }

  remainingFromDate(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return '0s';
    const totalSec = Math.floor(diff / 1000);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (d > 0 || h > 0) parts.push(`${h}h`);
    parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  callColor(c: { scheduled_date: string; created_in: string; made?: boolean; state?: string | null }): string {
    if (c.made) return c.state === 'effective' ? 'green' : 'red';
    const scheduled = new Date(c.scheduled_date).getTime();
    const created = new Date(c.created_in).getTime();
    const now = Date.now();
    if (scheduled <= now) return 'red';
    const total = scheduled - created;
    const remaining = scheduled - now;
    if (total <= 0) return 'red';
    const pct = remaining / total;
    if (pct > 0.5) return 'green';
    if (pct > 0.25) return 'yellow';
    if (pct > 0) return 'orange';
    return 'red';
  }

  loadPage(p: number): void {
    this.page = p;
    const isFirstLoad = this.calls().length === 0;
    if (isFirstLoad) this.loading.set(true);
    const params: any = {};
    if (this.filters.name) params.name = this.filters.name;
    if (this.filters.made_by) params.made_by = this.filters.made_by;
    if (this.filters.state) params.state = this.filters.state;
    params.page = p;
    params.page_size = this.pageSize || 99999;
    this.service.getAllCalls(params).subscribe({
      next: (res) => {
        this.calls.set(res.results);
        this.totalItems = res.count;
        this.totalPages = this.pageSize > 0 ? Math.ceil(res.count / this.pageSize) : 1;
        this.loading.set(false);
      },
      error: () => { this.toast.error('Error al cargar llamadas'); this.loading.set(false); },
    });
  }

  onFilterChange(): void {
    this.activeFilter.set(this.filters.state || '');
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => this.loadPage(1), 300);
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.name || this.filters.made_by || this.filters.state);
  }

  clearFilters(): void {
    this.filters.name = '';
    this.filters.made_by = '';
    this.filters.state = '';
    this.activeFilter.set('');
    this.loadPage(1);
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

  stateLabel(c: CallEntry): string {
    if (!c.made) {
      if (new Date(c.scheduled_date).getTime() <= Date.now()) return 'Vencida';
      return 'Pendiente';
    }
    return c.state === 'effective' ? 'Efectivo' : 'No Efectivo';
  }

  openDetail(c: CallEntry): void {
    this.selectedCall.set(c);
  }

  viewDetail(c: CallEntry): void {
    this.detailCall.set(c);
  }

  openEdit(c: CallEntry): void {
    this.editCall.set(c);
  }

  onCallSaved(): void {
    this.selectedCall.set(null);
    this.toast.success('Llamada registrada correctamente');
    this.loadStats();
    this.loadPage(this.page);
  }

  onEditSaved(): void {
    this.editCall.set(null);
    this.toast.success('Llamada actualizada correctamente');
    this.loadStats();
    this.loadPage(this.page);
  }

  onCallCreated(): void {
    this.showForm.set(false);
    this.toast.success('Llamada creada correctamente');
    this.loadStats();
    this.loadPage(1);
  }
}
