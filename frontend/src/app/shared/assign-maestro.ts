import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdviserService } from '../advisers/adviser.service';
import { PersonService } from '../persons/person.service';
import { AdviserListEntry } from '../advisers/adviser.model';
import { PersonListEntry } from '../persons/person.model';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-assign-maestro',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div class="bg-accent rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <div>
        <h2 class="text-lg font-bold text-primary">Inscribir a Fundamentos 1</h2>
        <p class="text-sm text-secondary mt-0.5">{{ person().names }} {{ person().lastname }}</p>
      </div>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>

    <div class="p-4">
      <p class="text-sm text-primary mb-3">Selecciona el Maestro que dará los fundamentos:</p>
      <div class="mb-3">
        <input [(ngModel)]="search"
          (input)="filterAdvisers()"
          placeholder="Buscar maestro..."
          class="w-full px-3 py-2 text-sm border border-theme rounded bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-black/20">
      </div>

      @if (loading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else if (filtered().length === 0) {
        <p class="text-center py-8 text-secondary text-sm">No se encontraron maestros disponibles</p>
      } @else {
        <div class="space-y-1 max-h-80 overflow-y-auto">
          @for (a of filtered(); track a.id) {
            <button (click)="selectAdviser(a)"
              class="w-full text-left px-3 py-2.5 rounded-lg border border-theme hover:bg-accent-hover transition-colors flex items-center justify-between"
              [class.border-blue-300]="selectedId === a.id"
              [class.bg-blue-50]="selectedId === a.id"
            >
              <div>
                <span class="text-sm font-medium text-primary">{{ a.full_name }}</span>
                <p class="text-xs text-secondary mt-0.5">{{ a.document }} &middot; {{ a.assigned_count }}/3 asignados</p>
              </div>
              <div class="text-right text-xs text-secondary">
                @if (a.assigned_count >= 3) {
                  <span class="text-red-500 font-medium">Completo</span>
                } @else {
                  <span class="text-green-600">Disponible</span>
                }
              </div>
            </button>
          }
        </div>
      }
    </div>

    <div class="p-4 border-t border-theme flex justify-end gap-2">
      <button class="px-4 py-2 border border-theme rounded text-sm hover:bg-accent-hover text-secondary transition-colors" (click)="close.emit()">Cancelar</button>
      <button (click)="confirmEnroll()" [disabled]="!selectedId"
        class="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 bg-primary text-on-primary hover:bg-primary-hover"
      >Inscribir</button>
    </div>
  </div>
</div>
`
})
export class AssignMaestro implements OnInit {
  private adviserService = inject(AdviserService);
  private personService = inject(PersonService);
  private toast = inject(ToastService);

  person = input.required<PersonListEntry>();
  close = output<void>();
  saved = output<void>();

  allAdvisers = signal<AdviserListEntry[]>([]);
  filtered = signal<AdviserListEntry[]>([]);
  loading = signal(false);
  search = '';
  selectedId: number | null = null;

  ngOnInit(): void {
    this.loadAdvisers();
  }

  private loadAdvisers(): void {
    this.loading.set(true);
    this.adviserService.list({ is_active: 'true', role_name: 'Maestro' }).subscribe({
      next: (res) => {
        this.allAdvisers.set(res.results);
        this.filtered.set(res.results);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar maestros');
        this.loading.set(false);
      },
    });
  }

  filterAdvisers(): void {
    const q = this.search.toLowerCase();
    this.filtered.set(
      this.allAdvisers().filter(a => a.full_name.toLowerCase().includes(q))
    );
  }

  selectAdviser(a: AdviserListEntry): void {
    this.selectedId = a.id;
  }

  confirmEnroll(): void {
    if (!this.selectedId) return;
    const p = this.person();
    this.personService.enrollFundamentals(p.id, this.selectedId).subscribe({
      next: () => {
        this.saved.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.error || err.error?.detail || 'Error al inscribir');
      },
    });
  }
}
