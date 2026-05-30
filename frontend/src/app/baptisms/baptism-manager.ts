import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaptismService } from './baptism.service';
import { Attendant, Calendar, Mode, ClassEntry } from './baptism.model';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: '[app-manager-table]',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-2">
      <div class="flex gap-2">
        @for (f of fields(); track f.key) {
          <input [(ngModel)]="newItem[f.key]" [placeholder]="f.label" [type]="f.type"
            class="flex-1 px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none" />
        }
        <button (click)="doCreate()" class="px-3 py-1 rounded text-xs bg-primary text-on-primary hover:bg-primary-hover shrink-0">+</button>
      </div>
      <div class="space-y-1 max-h-60 overflow-auto">
        @for (item of items(); track item.id) {
          @if (editId() === item.id) {
            <div class="flex gap-2 items-center px-3 py-2 rounded border border-theme">
              @for (f of fields(); track f.key) {
                <input [(ngModel)]="editItem[f.key]" [placeholder]="f.label" [type]="f.type"
                  class="flex-1 px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none" />
              }
              <button (click)="doUpdate(item.id)" class="text-xs text-blue-500 hover:text-blue-700">Guardar</button>
              <button (click)="editId.set(null)" class="text-xs text-secondary">Cancelar</button>
            </div>
          } @else {
            <div class="flex items-center justify-between px-3 py-2 rounded border border-theme text-sm">
              <span class="text-primary">{{ fieldValues(item) }}</span>
              <div class="flex gap-2">
                <button (click)="startEdit(item)" class="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                @if (allowDelete()) {
                  <button (click)="onRemove(item.id)" class="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ManagerTable {
  items = input.required<any[]>();
  fields = input.required<{ key: string; label: string; type: string }[]>();
  allowDelete = input(false);
  create = output<any>();
  update = output<any>();
  remove = output<number>();

  editId = signal<number | null>(null);
  editItem: any = {};
  newItem: any = {};

  fieldValues(item: any): string {
    return this.fields().map(f => item[f.key] || '').filter(Boolean).join(' — ');
  }

  startEdit(item: any): void {
    this.editId.set(item.id);
    this.editItem = { ...item };
  }

  doCreate(): void {
    if (this.newItem && Object.values(this.newItem).some(v => v)) {
      this.create.emit({ ...this.newItem });
      this.newItem = {};
    }
  }

  doUpdate(id: number): void {
    this.update.emit({ id, ...this.editItem });
    this.editId.set(null);
  }

  onRemove(id: number): void {
    this.remove.emit(id);
  }
}

@Component({
  selector: 'app-baptism-manager',
  standalone: true,
  imports: [FormsModule, ManagerTable],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
      <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4 shrink-0">
          <h3 class="text-lg font-semibold text-primary">{{ tabLabels[activeTab] }}</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        <div class="flex gap-1 mb-4 border-b border-theme shrink-0 overflow-x-auto">
          @for (tab of tabs; track tab; let i = $index) {
            <button (click)="activeTab = i"
              class="px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap"
              [class.text-primary]="activeTab === i"
              [class.text-secondary]="activeTab !== i"
              [class.border-b-2]="activeTab === i"
              [class.border-primary]="activeTab === i"
            >{{ tabLabels[i] }}</button>
          }
        </div>

        <div class="flex-1 overflow-auto space-y-4">
          @switch (activeTab) {
            @case (0) { <div app-manager-table [items]="attendants()" [fields]="attFields" (create)="createAtt($event)" (update)="updateAtt($event)" (remove)="deleteAtt($event)" [allowDelete]="allowDelete"></div> }
            @case (1) {
              <div class="space-y-3">
                <div class="border border-theme rounded-lg p-3 space-y-2">
                  <p class="text-xs font-medium text-secondary">Crear clase</p>
                  <div>
                    <label class="text-xs text-secondary mb-0.5 block">Calendario</label>
                    <select [(ngModel)]="newClassCalId"
                      class="w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
                      <option [value]="0">Seleccionar calendario...</option>
                      @for (c of calendars(); track c.id) {
                        <option [value]="c.id">{{ c.day }} {{ c.hour }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="text-xs text-secondary mb-0.5 block">Modalidad</label>
                    <select [(ngModel)]="newClassModeId"
                      class="w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
                      <option [value]="0">Seleccionar modalidad...</option>
                      @for (m of modes(); track m.id) {
                        <option [value]="m.id">{{ m.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label class="text-xs text-secondary mb-0.5 block">Profesor</label>
                    <select [(ngModel)]="newClassProf"
                      class="w-full px-2 py-1 text-xs border border-theme rounded bg-accent text-primary focus:outline-none">
                      <option [value]="0">Seleccionar...</option>
                      @for (a of allAdvisers; track a.id) { <option [value]="a.id">{{ a.full_name }}</option> }
                    </select>
                  </div>
                  <button (click)="addClass()"
                    class="mt-1 px-3 py-1 rounded text-xs bg-primary text-on-primary hover:bg-primary-hover transition-colors">+ Crear clase</button>
                </div>
                <div class="space-y-1 max-h-48 overflow-auto">
                  @for (cl of classes(); track cl.id) {
                    <div class="flex items-center justify-between px-3 py-2 rounded border border-theme text-sm">
                      <span class="text-primary">{{ getCalLabel(cl.calendar) }} — {{ getModeLabel(cl.mode) }} — {{ getProfessorLabel(cl.professor) }}</span>
                      @if (allowDelete) {
                        <button (click)="deleteClass(cl.id)" class="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
            @case (2) { <div app-manager-table [items]="calendars()" [fields]="calFields" (create)="createCal($event)" (update)="updateCal($event)" (remove)="deleteCal($event)" [allowDelete]="allowDelete"></div> }
            @case (3) { <div app-manager-table [items]="modes()" [fields]="modeFields" (create)="createMode($event)" (update)="updateMode($event)" (remove)="deleteMode($event)" [allowDelete]="allowDelete"></div> }
          }
        </div>
      </div>
    </div>
  `,
})
export class BaptismManager implements OnInit {
  private service = inject(BaptismService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  close = output();
  saved = output();

  personId = input<number>(0);
  initialTab = input(0);
  allowDelete = this.auth.getUserRole() === 'Administrador';
  activeTab = 0;
  tabs = ['attendants', 'classes', 'calendars', 'modes'];
  tabLabels = ['Acudientes', 'Clases', 'Calendarios', 'Modalidades'];

  allAdvisers: any[] = [];

  attendants = signal<Attendant[]>([]);
  calendars = signal<Calendar[]>([]);
  modes = signal<Mode[]>([]);
  classes = signal<ClassEntry[]>([]);

  attFields = [
    { key: 'full_name', label: 'Nombre', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' },
  ];

  calFields = [
    { key: 'day', label: 'Día', type: 'text' },
    { key: 'hour', label: 'Hora', type: 'time' },
  ];

  modeFields = [
    { key: 'name', label: 'Nombre', type: 'text' },
  ];

  newClassCalId = 0;
  newClassModeId = 0;
  newClassProf = 0;

  ngOnInit(): void {
    this.activeTab = this.initialTab();
    const adviserId = this.auth.getAdviserId();
    if (adviserId) this.newClassProf = adviserId;
    this.loadAll();
  }

  private loadAll(): void {
    this.service.getAttendants().subscribe({ next: (r) => this.attendants.set(r) });
    this.service.getCalendars().subscribe({ next: (r) => this.calendars.set(r) });
    this.service.getModes().subscribe({ next: (r) => this.modes.set(r) });
    this.service.getClasses().subscribe({ next: (r) => this.classes.set(r) });
    this.service.getAdviserList().subscribe({
      next: (r: any) => {
        this.allAdvisers = r.results || r;
      },
    });
  }

  getCalLabel(id: number): string {
    const c = this.calendars().find(x => x.id === id);
    return c ? `${c.day} ${c.hour}` : '—';
  }

  getModeLabel(id: number): string {
    const m = this.modes().find(x => x.id === id);
    return m ? m.name : '—';
  }

  getProfessorLabel(id: number): string {
    const a = this.allAdvisers.find(x => x.id === id);
    return a ? a.full_name : '—';
  }

  createAtt(data: any): void {
    if (this.personId()) data.person = this.personId();
    this.service.createAttendant(data).subscribe({
      next: (r) => { this.attendants.update(l => [...l, r]); this.toast.success('Acudiente creado'); },
      error: () => this.toast.error('Error al crear'),
    });
  }
  updateAtt(data: any): void {
    if (this.personId()) data.person = this.personId();
    this.service.updateAttendant(data.id, data).subscribe({
      next: () => { this.loadAll(); this.toast.success('Acudiente actualizado'); },
      error: () => this.toast.error('Error al actualizar'),
    });
  }
  deleteAtt(id: number): void {
    this.service.deleteAttendant(id).subscribe({
      next: () => { this.attendants.update(l => l.filter(x => x.id !== id)); this.toast.success('Acudiente eliminado'); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  createCal(data: any): void {
    this.service.createCalendar(data).subscribe({
      next: (r) => { this.calendars.update(l => [...l, r]); this.toast.success('Calendario creado'); },
      error: () => this.toast.error('Error al crear'),
    });
  }
  updateCal(data: any): void {
    this.service.updateCalendar(data.id, data).subscribe({
      next: () => { this.loadAll(); this.toast.success('Calendario actualizado'); },
      error: () => this.toast.error('Error al actualizar'),
    });
  }
  deleteCal(id: number): void {
    this.service.deleteCalendar(id).subscribe({
      next: () => { this.calendars.update(l => l.filter(x => x.id !== id)); this.toast.success('Calendario eliminado'); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  createMode(data: any): void {
    this.service.createMode(data).subscribe({
      next: (r) => { this.modes.update(l => [...l, r]); this.toast.success('Modalidad creada'); },
      error: () => this.toast.error('Error al crear'),
    });
  }
  updateMode(data: any): void {
    this.service.updateMode(data.id, data).subscribe({
      next: () => { this.loadAll(); this.toast.success('Modalidad actualizada'); },
      error: () => this.toast.error('Error al actualizar'),
    });
  }
  deleteMode(id: number): void {
    this.service.deleteMode(id).subscribe({
      next: () => { this.modes.update(l => l.filter(x => x.id !== id)); this.toast.success('Modalidad eliminada'); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  addClass(): void {
    if (!this.newClassCalId || !this.newClassModeId || !this.newClassProf) {
      this.toast.error('Selecciona calendario, modalidad y profesor');
      return;
    }
    this.service.createClass({
      calendar: this.newClassCalId,
      mode: this.newClassModeId,
      professor: this.newClassProf,
    }).subscribe({
      next: (r) => {
        this.classes.update(l => [...l, r]);
        this.newClassCalId = 0;
        this.newClassModeId = 0;
        const adviserId = this.auth.getAdviserId();
        this.newClassProf = adviserId || 0;
        this.toast.success('Clase creada');
      },
      error: () => this.toast.error('Error al crear clase'),
    });
  }

  deleteClass(id: number): void {
    this.service.deleteClass(id).subscribe({
      next: () => { this.classes.update(l => l.filter(x => x.id !== id)); this.toast.success('Clase eliminada'); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }
}
