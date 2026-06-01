import { Component, inject, OnInit, OnDestroy, signal, viewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from './dashboard.service';
import { DashboardData, AdviserStats } from './dashboard.model';
import { ToastService } from '../shared/toast.service';
import { CallService } from '../calls/call.service';
import { CallEntry } from '../calls/call.model';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isAdmin) {
      <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-between">
          <div>
            <h2 class="text-xl font-semibold text-primary">Panel de Administración</h2>
            <p class="text-sm text-secondary mt-0.5">
              @if (selectedPeriod === 'annual') { Click en un año para ver los meses }
              @else if (selectedPeriod === 'monthly') { Click en un mes para ver las semanas }
              @else { Reporte semanal }
            </p>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <select [(ngModel)]="selectedPeriod" (change)="loadData()"
              class="text-sm px-3 py-1.5 rounded-lg border border-theme bg-accent text-primary focus:outline-none">
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
            <input type="date" [ngModel]="startDate" (ngModelChange)="startDate=$event; loadData()"
              class="text-sm px-3 py-1.5 rounded-lg border border-theme bg-accent text-primary focus:outline-none" />
            <span class="text-secondary text-xs">a</span>
            <input type="date" [ngModel]="endDate" (ngModelChange)="endDate=$event; loadData()"
              class="text-sm px-3 py-1.5 rounded-lg border border-theme bg-accent text-primary focus:outline-none" />
            @if (startDate || endDate) {
              <button (click)="clearFilters()"
                class="text-xs px-3 py-1.5 rounded-lg border border-theme hover:bg-accent-hover transition-colors text-secondary">Limpiar filtros</button>
            }
          </div>
        </div>

        <div class="relative">
          @if (loading()) {
            <div class="absolute inset-0 z-10 flex items-start justify-center pt-12 bg-accent/60 rounded-xl">
              <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          }
          @if (isSpiritualFather && pendingCalls().length > 0) {
            <div class="bg-accent rounded-xl border border-theme p-4 mb-6">
              <h3 class="text-sm font-semibold text-primary mb-3">Llamadas Pendientes</h3>
              <div class="space-y-2">
                @for (c of pendingCalls(); track c.detail_id) {
                  <div class="flex items-center gap-3 p-2 rounded-lg border border-theme/50 cursor-pointer hover:bg-accent-hover transition-colors" (click)="goToCalls(c)">
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
              @if (isSpiritualFather && expiredCalls().length > 0) {
                <div class="bg-accent rounded-xl border border-red-200 dark:border-red-800 p-4 mb-6">
                  <h3 class="text-sm font-semibold text-red-600 mb-3">Llamadas Vencidas</h3>
                  <div class="space-y-2">
                    @for (c of expiredCalls(); track c.detail_id) {
                      <div class="flex items-center gap-3 p-2 rounded-lg border border-red-100 dark:border-red-900 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" (click)="goToCalls(c)">
                        <span class="inline-block w-3 h-3 rounded-full shrink-0 bg-red-500"></span>
                        <span class="flex-1 text-sm text-primary">{{ c.person_name }}</span>
                        <span class="text-xs text-secondary">#{{ c.call_number }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
              <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-accent rounded-xl border border-theme p-4 cursor-pointer transition-opacity"
              (click)="toggleDataset('total_registered', data()?.summary?.total_registered ?? 0)"
              [class.opacity-40]="!visibleDatasets()['total_registered'] || (data()?.summary?.total_registered ?? 0) === 0">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Consolidados</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ data()?.summary?.total_registered ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">Total registrados</p>
            </div>
            <div class="bg-accent rounded-xl border border-theme p-4 cursor-pointer transition-opacity"
              (click)="toggleDataset('new_people', data()?.summary?.new_people ?? 0)"
              [class.opacity-40]="!visibleDatasets()['new_people'] || (data()?.summary?.new_people ?? 0) === 0">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Nuevos</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ data()?.summary?.new_people ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">No viene de otra iglesia</p>
            </div>
            <div class="bg-accent rounded-xl border border-theme p-4 cursor-pointer transition-opacity"
              (click)="toggleDataset('other_church', data()?.summary?.other_church ?? 0)"
              [class.opacity-40]="!visibleDatasets()['other_church'] || (data()?.summary?.other_church ?? 0) === 0">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Otra Iglesia</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ data()?.summary?.other_church ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">Viene de otra iglesia</p>
            </div>
            <div class="bg-accent rounded-xl border border-theme p-4 cursor-pointer transition-opacity"
              (click)="toggleDataset('effective', data()?.summary?.effective ?? 0)"
              [class.opacity-40]="!visibleDatasets()['effective'] || (data()?.summary?.effective ?? 0) === 0">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Efectivos</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ data()?.summary?.effective ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">Permanecen en la iglesia</p>
            </div>
            <div class="bg-accent rounded-xl border border-theme p-4 cursor-pointer transition-opacity"
              (click)="toggleDataset('baptized', data()?.summary?.baptized ?? 0)"
              [class.opacity-40]="!visibleDatasets()['baptized'] || (data()?.summary?.baptized ?? 0) === 0">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Bautizados</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ data()?.summary?.baptized ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">Bautizados</p>
            </div>
          </div>

          <div class="bg-accent rounded-xl border border-theme p-4 sm:p-6">
            <h3 class="text-sm font-semibold text-primary mb-4">Tendencia</h3>
            <div class="relative" style="height: 300px; width: 100%;">
              <canvas #chartCanvas style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        <h2 class="text-xl font-semibold text-primary">Mi Panel</h2>
        @if (loading()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-accent rounded-xl border border-theme p-4">
              <p class="text-xs text-secondary uppercase tracking-wide font-medium">Asignados</p>
              <p class="text-3xl font-bold text-primary mt-1">{{ stats()?.total_assigned ?? 0 }}</p>
              <p class="text-xs text-secondary mt-1">Personas a cargo</p>
            </div>
            @if (!isMaestro) {
              <div class="bg-accent rounded-xl border border-theme p-4">
                <p class="text-xs text-secondary uppercase tracking-wide font-medium">Pendientes</p>
                <p class="text-3xl font-bold text-amber-600 mt-1">{{ stats()?.pending_calls ?? 0 }}</p>
                <p class="text-xs text-secondary mt-1">Llamadas por hacer</p>
              </div>
              <div class="bg-accent rounded-xl border border-theme p-4">
                <p class="text-xs text-secondary uppercase tracking-wide font-medium">Vencidas</p>
                <p class="text-3xl font-bold text-red-600 mt-1">{{ stats()?.expired_calls ?? 0 }}</p>
                <p class="text-xs text-secondary mt-1">Llamadas vencidas</p>
              </div>
              <div class="bg-accent rounded-xl border border-theme p-4">
                <p class="text-xs text-secondary uppercase tracking-wide font-medium">Realizadas</p>
                <p class="text-3xl font-bold text-green-600 mt-1">{{ stats()?.made_calls ?? 0 }}</p>
                <p class="text-xs text-secondary mt-1">Llamadas completadas</p>
              </div>
            }
            @if (isMaestro) {
              <div class="bg-accent rounded-xl border border-theme p-4">
                <p class="text-xs text-secondary uppercase tracking-wide font-medium">Bautizados</p>
                <p class="text-3xl font-bold text-green-600 mt-1">{{ stats()?.baptized_baptism ?? 0 }}</p>
                <p class="text-xs text-secondary mt-1">Registros completados</p>
              </div>
              <div class="bg-accent rounded-xl border border-theme p-4">
                <p class="text-xs text-secondary uppercase tracking-wide font-medium">Pend. Bautizo</p>
                <p class="text-3xl font-bold text-amber-600 mt-1">{{ stats()?.pending_baptism ?? 0 }}</p>
                <p class="text-xs text-secondary mt-1">Por inscribir a bautizo</p>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class Dashboard implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  isAdmin = this.auth.isAdmin();
  isMaestro = this.auth.isTeacher();
  isSpiritualFather = this.auth.isSpiritualFather();

  // Admin dashboard
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  data = signal<DashboardData | null>(null);
  selectedPeriod = 'monthly';
  startDate = '';
  endDate = '';
  private chart: Chart | null = null;
  visibleDatasets = signal<Record<string, boolean>>({
    total_registered: true,
    new_people: true,
    other_church: true,
    effective: true,
    baptized: true,
  });

  // Adviser dashboard
  loading = signal(false);
  stats = signal<AdviserStats | null>(null);
  pendingCalls = signal<CallEntry[]>([]);
  expiredCalls = signal<CallEntry[]>([]);
  tick = signal(0);
  private timerInterval: any;
  private refreshInterval: any;
  private callService = inject(CallService);
  private router = inject(Router);

  ngOnInit(): void {
    Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, BarController, ChartDataLabels);
    if (this.isAdmin) {
      this.loadAdminData();
    } else {
      this.loadStats();
    }
    if (this.isSpiritualFather) {
      this.loadPendingCalls();
      this.timerInterval = setInterval(() => this.tick.set(this.tick() + 1), 1000);
      this.refreshInterval = setInterval(() => this.loadPendingCalls(), 30000);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    clearInterval(this.timerInterval);
    clearInterval(this.refreshInterval);
  }

  goToCalls(c: CallEntry): void {
    this.router.navigate(['/calls'], { queryParams: { name: c.person_name } });
  }

  toggleDataset(key: string, value: number): void {
    if (value === 0) return;
    this.visibleDatasets.update(v => ({ ...v, [key]: !v[key] }));
    requestAnimationFrame(() => this.renderChart());
  }

  private loadAdminData(): void {
    this.chart?.destroy();
    this.chart = null;
    this.loading.set(true);
    this.dashboardService
      .getReport(this.selectedPeriod, this.startDate || undefined, this.endDate || undefined)
      .subscribe({
        next: (res) => {
          this.data.set(res);
          this.loading.set(false);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => this.renderChart());
          });
        },
        error: (err) => {
          console.error('Error loading dashboard data:', err);
          this.loading.set(false);
          this.toast.error('Error al cargar datos del dashboard');
        },
      });
  }

  loadData(): void {
    this.loadAdminData();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadData();
  }

  private loadStats(): void {
    this.loading.set(true);
    this.dashboardService.getMyStats()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.stats.set(res);
        },
        error: () => {
          this.toast.error('Error al cargar estadísticas');
        },
      });
  }

  private drillDown(index: number): void {
    const trend = this.data()?.trend ?? [];
    if (!trend[index]) return;
    const raw = trend[index].date;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;

    if (this.selectedPeriod === 'annual') {
      this.selectedPeriod = 'monthly';
      const year = d.getFullYear();
      this.startDate = `${year}-01-01`;
      this.endDate = `${year}-12-31`;
    } else if (this.selectedPeriod === 'monthly') {
      this.selectedPeriod = 'weekly';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      this.startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
      this.endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    }
    this.loadData();
  }

  private loadPendingCalls(): void {
    this.callService.getAllCalls({ page_size: 99999 }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res) => {
        const now = new Date();
        const pending = res.results.filter(c => !c.made);
        this.pendingCalls.set(pending.filter(c => new Date(c.scheduled_date) >= now));
        this.expiredCalls.set(pending.filter(c => new Date(c.scheduled_date) < now));
      },
      error: () => {},
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

  callColor(c: { scheduled_date: string; created_in: string }): string {
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

  private renderChart(): void {
    try {
      const canvasEl = this.chartCanvas();
      if (!canvasEl) {
        console.warn('Canvas not found in DOM');
        this.chart?.destroy();
        this.chart = null;
        return;
      }

      const trend = this.data()?.trend ?? [];
      if (!trend.length) {
        this.chart?.destroy();
        this.chart = null;
        return;
      }

      const ctx = canvasEl.nativeElement.getContext('2d');
      if (!ctx) {
        this.chart?.destroy();
        this.chart = null;
        return;
      }

      const labelFormat: Intl.DateTimeFormatOptions =
      this.selectedPeriod === 'weekly' ? { day: 'numeric', month: 'short' }
      : this.selectedPeriod === 'annual' ? { year: 'numeric' }
      : { month: 'short' };

    const labels = trend.map((e) => {
      const d = new Date(e.date);
      return d.toLocaleDateString('es-ES', labelFormat);
    });

    const allDatasets: { key: string; label: string; data: number[]; backgroundColor: string; borderColor: string; borderWidth: number; borderRadius: number }[] = [
      {
        key: 'total_registered',
        label: 'Consolidados',
        data: trend.map((e) => e.total),
        backgroundColor: 'rgba(107, 114, 128, 0.7)',
        borderColor: '#6b7280',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        key: 'new_people',
        label: 'Nuevos',
        data: trend.map((e) => e.new_people),
        backgroundColor: 'rgba(22, 163, 74, 0.7)',
        borderColor: '#16a34a',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        key: 'other_church',
        label: 'Otra Iglesia',
        data: trend.map((e) => e.other_church),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: '#a855f7',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        key: 'effective',
        label: 'Efectivos',
        data: trend.map((e) => e.effective),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        key: 'baptized',
        label: 'Bautizados',
        data: trend.map((e) => e.baptized),
        backgroundColor: 'rgba(217, 119, 6, 0.7)',
        borderColor: '#d97706',
        borderWidth: 1,
        borderRadius: 4,
      },
    ];

    const visibleKeys = this.visibleDatasets();
    const datasets = allDatasets
      .filter(d => visibleKeys[d.key])
      .filter(d => d.data.some(v => v > 0))
      .map(({ key: _, ...rest }) => rest);

    if (datasets.length === 0) {
      this.chart?.destroy();
      this.chart = null;
      return;
    }

      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.update();
      } else {
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { boxWidth: 12, padding: 16, font: { size: 12 } },
                onClick: () => {},
              },
              tooltip: {
                backgroundColor: '#171717',
                titleFont: { size: 12 },
                bodyFont: { size: 12 },
              },
              datalabels: {
                anchor: 'end',
                align: 'end',
                color: '#374151',
                font: { size: 10, weight: 'bold' },
                offset: 0,
                display: (ctx) => {
                  const val = ctx.dataset.data[ctx.dataIndex] as number;
                  return val > 0;
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.06)' },
              },
            },
          },
        });
      }
    } catch (e) {
      console.error('Error rendering chart:', e);
      this.chart?.destroy();
      this.chart = null;
    }
  }
}
