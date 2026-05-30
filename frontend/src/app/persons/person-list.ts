import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PersonService } from './person.service';
import { PersonListEntry } from './person.model';
import { PersonCreate } from './person-create';
import { PersonEdit } from './person-edit';
import { PersonDetailComponent } from './person-detail';
import { BaptismService } from '../baptisms/baptism.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';
import { ConfirmService } from '../shared/confirm';
import { AssignFather } from '../shared/assign-father';

@Component({
  selector: 'app-person-list',
  standalone: true,
  imports: [FormsModule, PersonCreate, PersonEdit, PersonDetailComponent, AssignFather],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-primary">Listado de Personas</h2>
        <button (click)="createModalOpen.set(true)"
          class="text-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors"
        >+ Nueva Persona</button>
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
              <th class="px-3 py-2 text-left hidden md:table-cell">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Especialidad</span>
                <select [(ngModel)]="filters.specialism" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                  <option value="">Todos</option>
                  <option value="joven">Joven</option>
                  <option value="normal">Normal</option>
                  <option value="other_church">Otra Iglesia</option>
                  <option value="distance">Distancia</option>
                </select>
              </th>
              <th class="px-3 py-2 text-left">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Estado</span>
                <select [(ngModel)]="filters.assignment_state" (change)="onFilterChange()"
                  class="mt-1 w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
                  <option value="">Todos</option>
                  <option value="assigned">Asignado</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                </select>
              </th>
              <th class="px-3 py-2 text-right">
                <span class="text-xs font-medium text-secondary uppercase tracking-wide">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @if (persons().length === 0 && !loading()) {
              <tr><td colspan="6" class="text-center py-8 text-secondary">No se encontraron personas</td></tr>
            }
            @if (persons().length === 0 && loading()) {
              <tr><td colspan="6" class="text-center py-8 text-secondary">
                <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </td></tr>
            }
              @for (p of persons(); track p.id) {
                <tr class="border-b border-theme/50 hover:bg-accent-hover/30 transition-colors">
                  <td class="px-3 py-3">
                    <span class="text-primary font-medium">{{ p.names }} {{ p.lastname }}</span>
                    @if (p.spiritual_father_name) {
                      <p class="text-xs text-secondary mt-0.5">Padre: {{ p.spiritual_father_name }}</p>
                    }
                  </td>
                  <td class="px-3 py-3 text-secondary hidden sm:table-cell font-mono">{{ p.document }}</td>
                  <td class="px-3 py-3 text-secondary hidden md:table-cell font-mono">{{ p.phone }}</td>
                  <td class="px-3 py-3 text-secondary hidden md:table-cell">{{ specialismLabel(p.specialism) }}</td>
                  <td class="px-3 py-3">
                    <div class="flex flex-col gap-0.5">
                      <span class="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium w-fit"
                        [class.bg-blue-50]="p.assignment_state==='pending'" [class.text-blue-700]="p.assignment_state==='pending'"
                        [class.bg-green-50]="p.assignment_state==='assigned'" [class.text-green-700]="p.assignment_state==='assigned'"
                        [class.bg-gray-100]="p.assignment_state==='completed'" [class.text-gray-600]="p.assignment_state==='completed'"
                      >{{ stateLabel(p.assignment_state) }}</span>
                      @if (p.baptized) {
                        <span class="text-xs text-yellow-600 font-medium">Bautizado</span>
                      }
                    </div>
                  </td>
                  <td class="px-3 py-3 text-right whitespace-nowrap">
                    <button (click)="openDetail(p.id)" title="Ver detalle"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                    @if (!isTeacher) {
                      <button (click)="openEdit(p.id)" title="Editar"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent-hover transition-colors text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    }
                    @if (!isTeacher) {
                      <button (click)="goToCalls(p)" title="Ver llamadas"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-green-50 transition-colors text-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </button>
                    }
                    @if (isAdmin) {
                      <button (click)="assignFatherPerson.set(p)" title="Asignar padre espiritual"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-blue-50 transition-colors text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                      </button>
                    }
                    @if (!isTeacher && !p.enrollment_fund_1 && p.member_state === 'effective') {
                      <button (click)="confirmEnroll(p)" title="Inscribir a fundamentos"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-purple-50 transition-colors text-purple-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                      </button>
                    }
                    @if (p.enrollment_fund_1 && !p.baptized && !p.has_baptism) {
                      <button (click)="goToBaptisms(p)" title="Registrar bautizo"
                        class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-yellow-50 transition-colors text-yellow-500">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      </button>
                    }
                    <button (click)="viewBaptism(p)" title="Ir a bautizos"
                      class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-cyan-50 transition-colors text-cyan-500">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between text-sm text-secondary">
          <div class="flex items-center gap-2">
            <span>{{ totalItems }} personas</span>
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
      <app-person-detail [personId]="detailPersonId()" (close)="detailModalOpen.set(false)" />
    }

    @if (editModalOpen()) {
      <app-person-edit [personId]="editPersonId" (close)="closeEdit()" (saved)="onEditSaved()" />
    }

    @if (createModalOpen()) {
      <app-person-create (close)="createModalOpen.set(false)" (saved)="onCreateSaved()" />
    }

    @if (assignFatherPerson(); as p) {
      <app-assign-father [person]="p" (close)="assignFatherPerson.set(null)" (saved)="onFatherAssigned()" />
    }
  `,
})
export class PersonList implements OnInit {
  private service = inject(PersonService);
  private baptismService = inject(BaptismService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  persons = signal<PersonListEntry[]>([]);
  loading = signal(false);
  page = 1;
  totalItems = 0;
  totalPages = 0;
  pageSize = 10;
  role = this.auth.getUserRole();
  isAdmin = this.role === 'Administrador';
  isTeacher = this.role === 'Maestro';

  filters = {
    name: '',
    document: '',
    phone: '',
    specialism: '',
    assignment_state: '',
  };

  detailModalOpen = signal(false);
  detailPersonId = signal(0);
  createModalOpen = signal(false);
  editModalOpen = signal(false);
  editPersonId = 0;
  assignFatherPerson = signal<PersonListEntry | null>(null);

  private filterTimeout: any;

  ngOnInit(): void {
    this.loadPage(1);
  }

  onFilterChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => this.loadPage(1), 300);
  }

  loadPage(p: number): void {
    this.page = p;
    const isFirstLoad = this.persons().length === 0;
    if (isFirstLoad) this.loading.set(true);
    this.service.list({
      name: this.filters.name || undefined,
      document: this.filters.document || undefined,
      phone: this.filters.phone || undefined,
      specialism: this.filters.specialism || undefined,
      assignment_state: this.filters.assignment_state || undefined,
      page: this.page,
      page_size: this.pageSize > 0 ? this.pageSize : undefined,
    }).subscribe({
      next: (res) => {
        this.persons.set(res.results);
        this.totalItems = res.count;
        this.totalPages = Math.ceil(res.count / (this.pageSize > 0 ? this.pageSize : 1));
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

  specialismLabel(v: string): string {
    return { joven: 'Joven', normal: 'Normal', other_church: 'Otra Iglesia', distance: 'Distancia' }[v] || v;
  }

  stateLabel(v: string): string {
    return { pending: 'Pendiente', assigned: 'Asignado', completed: 'Completado' }[v] || v;
  }

  openDetail(id: number): void {
    this.detailPersonId.set(id);
    this.detailModalOpen.set(true);
  }

  openEdit(id: number): void {
    this.editPersonId = id;
    this.editModalOpen.set(true);
  }

  goToCalls(p: PersonListEntry): void {
    this.router.navigate(['/calls'], { queryParams: { name: `${p.names} ${p.lastname}` } });
  }

  goToBaptisms(p: PersonListEntry): void {
    this.baptismService.quickRegister(p.id).subscribe({
      next: () => { this.toast.success('Registro de bautizo creado'); this.loadPage(this.page); },
      error: (err) => { this.toast.error(err.error?.error || 'Error al crear registro'); },
    });
  }

  viewBaptism(p: PersonListEntry): void {
    this.router.navigate(['/baptisms'], { queryParams: { name: `${p.names} ${p.lastname}` } });
  }

  closeEdit(): void {
    this.editModalOpen.set(false);
  }

  onEditSaved(): void {
    this.closeEdit();
    this.toast.success('Persona actualizada correctamente');
    this.loadPage(this.page);
  }

  onCreateSaved(): void {
    this.createModalOpen.set(false);
    this.toast.success('Persona registrada correctamente');
    this.loadPage(1);
  }

  onFatherAssigned(): void {
    this.assignFatherPerson.set(null);
    this.toast.success('Padre espiritual asignado');
    this.loadPage(this.page);
  }

  async confirmEnroll(p: PersonListEntry): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Inscribir a Fundamentos',
      message: `¿Inscribir a ${p.names} ${p.lastname} en Fundamentos 1?`,
      confirmText: 'Inscribir',
    });
    if (!ok) return;
    this.service.enrollFundamentals(p.id).subscribe({
      next: () => { this.toast.success('Inscrito a Fundamentos 1'); this.loadPage(this.page); },
      error: (err) => {
        const msg = err.error?.error || err.error?.detail || 'Error al inscribir';
        this.toast.error(msg);
      },
    });
  }
}
