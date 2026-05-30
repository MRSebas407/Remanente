import { Component, inject, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LookupService } from './lookup.service';
import { ToastService } from './toast.service';
import { Role, Specialism } from '../advisers/adviser.model';

@Component({
  selector: 'app-lookup-manager',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
  <div class="bg-accent rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" (click)="\$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">Administrar roles y especialidades</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 space-y-6">
      <!-- Roles -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold text-base text-primary">Roles</h3>
          <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover" (click)="addRole()">+ Nuevo</button>
        </div>
        @if (addingRole()) {
        <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end">
          <div class="flex-1">
            <label class="text-xs text-secondary">Nombre</label>
            <input [(ngModel)]="newRoleName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre del rol">
          </div>
          <div class="flex-1">
            <label class="text-xs text-secondary">Descripción</label>
            <input [(ngModel)]="newRoleDesc" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Descripción">
          </div>
          <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveRole()">Guardar</button>
          <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddRole()">Cancelar</button>
        </div>
        }
        <table class="w-full text-sm">
          <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1">Descripción</th><th class="py-1">Estado</th><th class="py-1">Acción</th></tr></thead>
          <tbody>
            @for (r of roles(); track r.id) {
            <tr class="border-b border-theme/50">
              @if (editRoleId() === r.id) {
              <td class="py-1"><input [(ngModel)]="editRoleName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
              <td class="py-1"><input [(ngModel)]="editRoleDesc" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
              <td class="py-1 text-secondary">{{ r.is_active ? 'Activo' : 'Inactivo' }}</td>
              <td class="py-1 space-x-1">
                <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditRole(r)">Guardar</button>
                <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditRole()">Cancelar</button>
              </td>
              } @else {
              <td class="py-1 text-primary">{{ r.name }}</td>
              <td class="py-1 text-secondary">{{ r.description || '-' }}</td>
              <td class="py-1">
                <span [class.text-green-600]="r.is_active" [class.text-red-500]="!r.is_active">{{ r.is_active ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="py-1 space-x-1">
                <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditRole(r)">Editar</button>
                @if (r.is_active) {
                <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deactivateRole(r)">Desactivar</button>
                } @else {
                <button class="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700" (click)="activateRole(r)">Activar</button>
                }
              </td>
              }
            </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Specialisms -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-semibold text-base text-primary">Especialidades</h3>
          <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover" (click)="addSpecialism()">+ Nueva</button>
        </div>
        @if (addingSpecialism()) {
        <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end">
          <div class="flex-1">
            <label class="text-xs text-secondary">Nombre</label>
            <input [(ngModel)]="newSpecName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre de la especialidad">
          </div>
          <div class="flex-1">
            <label class="text-xs text-secondary">Descripción</label>
            <input [(ngModel)]="newSpecDesc" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Descripción">
          </div>
          <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveSpecialism()">Guardar</button>
          <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddSpecialism()">Cancelar</button>
        </div>
        }
        <table class="w-full text-sm">
          <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1">Descripción</th><th class="py-1">Estado</th><th class="py-1">Acción</th></tr></thead>
          <tbody>
            @for (s of specialisms(); track s.id) {
            <tr class="border-b border-theme/50">
              @if (editSpecId() === s.id) {
              <td class="py-1"><input [(ngModel)]="editSpecName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
              <td class="py-1"><input [(ngModel)]="editSpecDesc" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
              <td class="py-1 text-secondary">{{ s.is_active ? 'Activo' : 'Inactivo' }}</td>
              <td class="py-1 space-x-1">
                <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditSpecialism(s)">Guardar</button>
                <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditSpecialism()">Cancelar</button>
              </td>
              } @else {
              <td class="py-1 text-primary">{{ s.name }}</td>
              <td class="py-1 text-secondary">{{ s.description || '-' }}</td>
              <td class="py-1">
                <span [class.text-green-600]="s.is_active" [class.text-red-500]="!s.is_active">{{ s.is_active ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="py-1 space-x-1">
                <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditSpecialism(s)">Editar</button>
                @if (s.is_active) {
                <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deactivateSpecialism(s)">Desactivar</button>
                } @else {
                <button class="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700" (click)="activateSpecialism(s)">Activar</button>
                }
              </td>
              }
            </tr>
            }
            @empty {
            <tr><td colspan="4" class="text-center py-4 text-secondary">No hay especialidades</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <div class="p-4 border-t border-theme flex justify-end">
      <button class="px-4 py-2 border border-theme rounded hover:bg-accent-hover transition-colors text-secondary text-sm" (click)="close.emit()">Cerrar</button>
    </div>
  </div>
</div>
`
})
export class LookupManager implements OnInit {
  private ls = inject(LookupService);
  private toast = inject(ToastService);
  close = output<void>();

  roles = signal<Role[]>([]);
  specialisms = signal<Specialism[]>([]);

  addingRole = signal(false);
  newRoleName = '';
  newRoleDesc = '';
  addingSpecialism = signal(false);
  newSpecName = '';
  newSpecDesc = '';

  editRoleId = signal<number | null>(null);
  editRoleName = '';
  editRoleDesc = '';
  editSpecId = signal<number | null>(null);
  editSpecName = '';
  editSpecDesc = '';

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.ls.getRoles().subscribe(r => this.roles.set(r));
    this.ls.getSpecialisms().subscribe(s => this.specialisms.set(s));
  }

  addRole() {
    this.addingRole.set(true);
    this.newRoleName = '';
    this.newRoleDesc = '';
  }

  cancelAddRole() {
    this.addingRole.set(false);
  }

  saveRole() {
    if (!this.newRoleName.trim()) { this.toast.error('El nombre del rol es obligatorio'); return; }
    this.ls.createRole({ name: this.newRoleName.trim(), description: this.newRoleDesc.trim() }).subscribe({
      next: () => { this.toast.success('Rol creado'); this.addingRole.set(false); this.loadAll(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || e.error?.detail || 'Error al crear rol'),
    });
  }

  startEditRole(r: Role) {
    this.editRoleId.set(r.id);
    this.editRoleName = r.name;
    this.editRoleDesc = r.description;
  }

  cancelEditRole() {
    this.editRoleId.set(null);
  }

  saveEditRole(r: Role) {
    if (!this.editRoleName.trim()) { this.toast.error('El nombre del rol es obligatorio'); return; }
    this.ls.updateRole(r.id, { name: this.editRoleName.trim(), description: this.editRoleDesc.trim() }).subscribe({
      next: () => { this.toast.success('Rol actualizado'); this.editRoleId.set(null); this.loadAll(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || e.error?.detail || 'Error al actualizar rol'),
    });
  }

  deactivateRole(r: Role) {
    this.ls.deactivateRole(r.id).subscribe({
      next: () => { this.toast.success('Rol desactivado'); this.loadAll(); },
      error: () => this.toast.error('Error al desactivar rol'),
    });
  }

  activateRole(r: Role) {
    this.ls.activateRole(r.id).subscribe({
      next: () => { this.toast.success('Rol activado'); this.loadAll(); },
      error: () => this.toast.error('Error al activar rol'),
    });
  }

  addSpecialism() {
    this.addingSpecialism.set(true);
    this.newSpecName = '';
    this.newSpecDesc = '';
  }

  cancelAddSpecialism() {
    this.addingSpecialism.set(false);
  }

  saveSpecialism() {
    if (!this.newSpecName.trim()) { this.toast.error('El nombre de la especialidad es obligatorio'); return; }
    this.ls.createSpecialism({ name: this.newSpecName.trim(), description: this.newSpecDesc.trim() }).subscribe({
      next: () => { this.toast.success('Especialidad creada'); this.addingSpecialism.set(false); this.loadAll(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || e.error?.detail || 'Error al crear especialidad'),
    });
  }

  startEditSpecialism(s: Specialism) {
    this.editSpecId.set(s.id);
    this.editSpecName = s.name;
    this.editSpecDesc = s.description;
  }

  cancelEditSpecialism() {
    this.editSpecId.set(null);
  }

  saveEditSpecialism(s: Specialism) {
    if (!this.editSpecName.trim()) { this.toast.error('El nombre de la especialidad es obligatorio'); return; }
    this.ls.updateSpecialism(s.id, { name: this.editSpecName.trim(), description: this.editSpecDesc.trim() }).subscribe({
      next: () => { this.toast.success('Especialidad actualizada'); this.editSpecId.set(null); this.loadAll(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || e.error?.detail || 'Error al actualizar especialidad'),
    });
  }

  deactivateSpecialism(s: Specialism) {
    this.ls.deactivateSpecialism(s.id).subscribe({
      next: () => { this.toast.success('Especialidad desactivada'); this.loadAll(); },
      error: () => this.toast.error('Error al desactivar especialidad'),
    });
  }

  activateSpecialism(s: Specialism) {
    this.ls.activateSpecialism(s.id).subscribe({
      next: () => { this.toast.success('Especialidad activada'); this.loadAll(); },
      error: () => this.toast.error('Error al activar especialidad'),
    });
  }
}
