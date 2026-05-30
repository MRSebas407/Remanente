import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoreService } from './core.service';
import { ToastService } from './toast.service';
import { ConfirmService } from './confirm';
import { Country, City, Neighborhood, ChurchService } from '../persons/person.model';

@Component({
  selector: 'app-core-manager',
  standalone: true,
  imports: [FormsModule],
  template: `
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
  <div class="bg-accent rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4" (click)="\$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">{{ activeTab() === 'services' ? 'Administrar servicios' : 'Administrar ubicaciones' }}</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>

    <div class="p-4">
      <div class="flex gap-2 mb-4 flex-wrap">
        @for (tab of tabs; track tab.key) {
          <button (click)="switchTab(tab.key)"
            class="px-3 py-1.5 rounded-lg text-sm transition-colors"
            [class.bg-primary]="activeTab() === tab.key"
            [class.text-on-primary]="activeTab() === tab.key"
            [class.border]="activeTab() !== tab.key"
            [class.border-theme]="activeTab() !== tab.key"
            [class.text-secondary]="activeTab() !== tab.key"
            [class.hover:bg-accent-hover]="activeTab() !== tab.key"
          >{{ tab.label }}</button>
        }
      </div>

      @if (activeTab() === 'countries') {
        <div>
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold text-base text-primary">Países</h3>
            <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover" (click)="startAddCountry()">+ Nuevo</button>
          </div>
          @if (addingCountry()) {
            <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end">
              <div class="flex-1">
                <label class="text-xs text-secondary">Nombre</label>
                <input [(ngModel)]="newCountryName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre del país">
              </div>
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveCountry()">Guardar</button>
              <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddCountry()">Cancelar</button>
            </div>
          }
          <table class="w-full text-sm">
            <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1 w-32">Acción</th></tr></thead>
            <tbody>
              @for (c of countries(); track c.id) {
                <tr class="border-b border-theme/50">
                  @if (editingCountryId() === c.id) {
                    <td class="py-1"><input [(ngModel)]="editCountryName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditCountry(c)">Guardar</button>
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditCountry()">Cancelar</button>
                    </td>
                  } @else {
                    <td class="py-1 text-primary">{{ c.name }}</td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditCountry(c)">Editar</button>
                      @if (allowDelete()) {
                        <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deleteCountry(c)">Eliminar</button>
                      }
                    </td>
                  }
                </tr>
              }
              @empty {
                <tr><td colspan="2" class="text-center py-4 text-secondary">No hay países</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (activeTab() === 'cities') {
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 class="font-semibold text-base text-primary">Ciudades</h3>
            <div class="flex gap-2 items-center">
              <select (change)="onCityFilterChange($event)" class="px-2 py-1 text-xs border border-theme rounded bg-accent text-primary">
                <option value="">Todos los países</option>
                @for (c of countries(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
              <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover shrink-0" (click)="startAddCity()">+ Nueva</button>
            </div>
          </div>
          @if (addingCity()) {
            <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end flex-wrap">
              <div class="flex-1 min-w-[120px]">
                <label class="text-xs text-secondary">Nombre</label>
                <input [(ngModel)]="newCityName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre">
              </div>
              <div class="flex-1 min-w-[120px]">
                <label class="text-xs text-secondary">País</label>
                <select [(ngModel)]="newCityCountryId" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (c of countries(); track c.id) {
                    <option [ngValue]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveCity()">Guardar</button>
              <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddCity()">Cancelar</button>
            </div>
          }
          <table class="w-full text-sm">
            <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1">País</th><th class="py-1 w-32">Acción</th></tr></thead>
            <tbody>
              @for (c of cities(); track c.id) {
                <tr class="border-b border-theme/50">
                  @if (editingCityId() === c.id) {
                    <td class="py-1"><input [(ngModel)]="editCityName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
                    <td class="py-1">
                      <select [(ngModel)]="editCityCountryId" class="w-full border border-theme rounded px-1 py-0.5 text-sm bg-accent text-primary">
                        @for (co of countries(); track co.id) {
                          <option [ngValue]="co.id">{{ co.name }}</option>
                        }
                      </select>
                    </td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditCity(c)">Guardar</button>
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditCity()">Cancelar</button>
                    </td>
                  } @else {
                    <td class="py-1 text-primary">{{ c.name }}</td>
                    <td class="py-1 text-secondary">{{ countryName(c.country) }}</td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditCity(c)">Editar</button>
                      @if (allowDelete()) {
                        <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deleteCity(c)">Eliminar</button>
                      }
                    </td>
                  }
                </tr>
              }
              @empty {
                <tr><td colspan="3" class="text-center py-4 text-secondary">No hay ciudades</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (activeTab() === 'neighborhoods') {
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 class="font-semibold text-base text-primary">Barrios</h3>
            <div class="flex gap-2 items-center">
              <select (change)="onNHoodFilterChange($event)" class="px-2 py-1 text-xs border border-theme rounded bg-accent text-primary">
                <option value="">Todas las ciudades</option>
                @for (c of cities(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
              <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover shrink-0" (click)="startAddNeighborhood()">+ Nuevo</button>
            </div>
          </div>
          @if (addingNeighborhood()) {
            <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end flex-wrap">
              <div class="flex-1 min-w-[120px]">
                <label class="text-xs text-secondary">Nombre</label>
                <input [(ngModel)]="newNeighborhoodName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre">
              </div>
              <div class="flex-1 min-w-[120px]">
                <label class="text-xs text-secondary">Ciudad</label>
                <select [(ngModel)]="newNHoodCityId" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary">
                  <option [ngValue]="null">Seleccionar...</option>
                  @for (c of cities(); track c.id) {
                    <option [ngValue]="c.id">{{ c.name }}</option>
                  }
                </select>
              </div>
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveNeighborhood()">Guardar</button>
              <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddNeighborhood()">Cancelar</button>
            </div>
          }
          <table class="w-full text-sm">
            <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1">Ciudad</th><th class="py-1 w-32">Acción</th></tr></thead>
            <tbody>
              @for (n of neighborhoods(); track n.id) {
                <tr class="border-b border-theme/50">
                  @if (editingNHoodId() === n.id) {
                    <td class="py-1"><input [(ngModel)]="editNHoodName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
                    <td class="py-1">
                      <select [(ngModel)]="editNHoodCityId" class="w-full border border-theme rounded px-1 py-0.5 text-sm bg-accent text-primary">
                        @for (c of cities(); track c.id) {
                          <option [ngValue]="c.id">{{ c.name }}</option>
                        }
                      </select>
                    </td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditNeighborhood(n)">Guardar</button>
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditNeighborhood()">Cancelar</button>
                    </td>
                  } @else {
                    <td class="py-1 text-primary">{{ n.name }}</td>
                    <td class="py-1 text-secondary">{{ cityName(n.city) }}</td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditNeighborhood(n)">Editar</button>
                      @if (allowDelete()) {
                        <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deleteNeighborhood(n)">Eliminar</button>
                      }
                    </td>
                  }
                </tr>
              }
              @empty {
                <tr><td colspan="3" class="text-center py-4 text-secondary">No hay barrios</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (activeTab() === 'services') {
        <div>
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold text-base text-primary">Servicios</h3>
            <button class="text-sm px-3 py-1 bg-primary text-on-primary rounded hover:bg-primary-hover" (click)="startAddService()">+ Nuevo</button>
          </div>
          @if (addingService()) {
            <div class="flex gap-2 mb-2 p-2 border border-theme rounded bg-secondary items-end flex-wrap">
              <div class="flex-1 min-w-[120px]">
                <label class="text-xs text-secondary">Nombre</label>
                <input [(ngModel)]="newServiceName" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Nombre del servicio">
              </div>
              <div class="flex-[2] min-w-[200px]">
                <label class="text-xs text-secondary">Descripción</label>
                <input [(ngModel)]="newServiceDesc" class="w-full border border-theme rounded px-2 py-1 text-sm bg-accent text-primary" placeholder="Descripción">
              </div>
              <button class="px-3 py-1 bg-primary text-on-primary rounded text-sm hover:bg-primary-hover" (click)="saveService()">Guardar</button>
              <button class="px-3 py-1 border border-theme rounded text-sm hover:bg-accent-hover text-secondary" (click)="cancelAddService()">Cancelar</button>
            </div>
          }
          <table class="w-full text-sm">
            <thead><tr class="border-b border-theme text-left text-secondary"><th class="py-1">Nombre</th><th class="py-1">Descripción</th><th class="py-1">Estado</th><th class="py-1 w-32">Acción</th></tr></thead>
            <tbody>
              @for (s of services(); track s.id) {
                <tr class="border-b border-theme/50">
                  @if (editingServiceId() === s.id) {
                    <td class="py-1"><input [(ngModel)]="editServiceName" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
                    <td class="py-1"><input [(ngModel)]="editServiceDesc" class="w-full border border-theme rounded px-1 text-sm bg-accent text-primary"></td>
                    <td class="py-1 text-secondary">{{ s.is_active ? 'Activo' : 'Inactivo' }}</td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 bg-primary text-on-primary rounded text-xs hover:bg-primary-hover" (click)="saveEditService(s)">Guardar</button>
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="cancelEditService()">Cancelar</button>
                    </td>
                  } @else {
                    <td class="py-1 text-primary">{{ s.name }}</td>
                    <td class="py-1 text-secondary">{{ s.description || '-' }}</td>
                    <td class="py-1">
                      <span [class.text-green-600]="s.is_active" [class.text-red-500]="!s.is_active">{{ s.is_active ? 'Activo' : 'Inactivo' }}</span>
                    </td>
                    <td class="py-1 space-x-1">
                      <button class="px-2 py-0.5 border border-theme rounded text-xs hover:bg-accent-hover text-secondary" (click)="startEditService(s)">Editar</button>
                      @if (allowDelete()) {
                        <button class="px-2 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600" (click)="deleteService(s)">Eliminar</button>
                      }
                    </td>
                  }
                </tr>
              }
              @empty {
                <tr><td colspan="4" class="text-center py-4 text-secondary">No hay servicios</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <div class="p-4 border-t border-theme flex justify-end">
      <button class="px-4 py-2 border border-theme rounded hover:bg-accent-hover transition-colors text-secondary text-sm" (click)="close.emit()">Cerrar</button>
    </div>
  </div>
</div>
  `,
})
export class CoreManager implements OnInit {
  private core = inject(CoreService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  close = output<void>();
  allowDelete = input(true);
  initialTab = input('countries');

  tabs = [
    { key: 'countries', label: 'Países' },
    { key: 'cities', label: 'Ciudades' },
    { key: 'neighborhoods', label: 'Barrios' },
    { key: 'services', label: 'Servicios' },
  ];
  activeTab = signal('countries');
  private tabLoaded: Record<string, boolean> = {};

  countries = signal<Country[]>([]);
  addingCountry = signal(false);
  newCountryName = '';
  editingCountryId = signal<number | null>(null);
  editCountryName = '';

  cities = signal<City[]>([]);
  addingCity = signal(false);
  newCityName = '';
  newCityCountryId: number | null = null;
  editingCityId = signal<number | null>(null);
  editCityName = '';
  editCityCountryId: number | null = null;
  cityFilterCountryId: number | null = null;

  neighborhoods = signal<Neighborhood[]>([]);
  addingNeighborhood = signal(false);
  newNeighborhoodName = '';
  newNHoodCityId: number | null = null;
  editingNHoodId = signal<number | null>(null);
  editNHoodName = '';
  editNHoodCityId: number | null = null;
  nhoodFilterCityId: number | null = null;

  services = signal<ChurchService[]>([]);
  addingService = signal(false);
  newServiceName = '';
  newServiceDesc = '';
  editingServiceId = signal<number | null>(null);
  editServiceName = '';
  editServiceDesc = '';

  ngOnInit(): void {
    this.switchTab(this.initialTab());
  }

  switchTab(key: string): void {
    this.activeTab.set(key);
    if (!this.tabLoaded[key]) {
      this.tabLoaded[key] = true;
      switch (key) {
        case 'countries': this.loadCountries(); break;
        case 'cities': this.loadCities(); break;
        case 'neighborhoods': this.loadNeighborhoods(); break;
        case 'services': this.loadServices(); break;
      }
    }
  }

  countryName(id: number): string {
    return this.countries().find(c => c.id === id)?.name || '';
  }

  cityName(id: number): string {
    return this.cities().find(c => c.id === id)?.name || '';
  }

  private loadCountries(): void {
    this.core.getCountries().subscribe(c => this.countries.set(c));
  }

  private loadCities(): void {
    this.core.getCities(this.cityFilterCountryId ?? undefined).subscribe(c => this.cities.set(c));
  }

  private loadNeighborhoods(): void {
    this.core.getNeighborhoods(this.nhoodFilterCityId ?? undefined).subscribe(n => this.neighborhoods.set(n));
  }

  private loadServices(): void {
    this.core.getServices().subscribe(s => this.services.set(s));
  }

  onCityFilterChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.cityFilterCountryId = v ? parseInt(v) : null;
    this.loadCities();
  }

  onNHoodFilterChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.nhoodFilterCityId = v ? parseInt(v) : null;
    this.loadNeighborhoods();
  }

  // Countries
  startAddCountry(): void {
    this.addingCountry.set(true);
    this.newCountryName = '';
  }

  cancelAddCountry(): void {
    this.addingCountry.set(false);
  }

  saveCountry(): void {
    if (!this.newCountryName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.createCountry({ name: this.newCountryName.trim() }).subscribe({
      next: () => { this.toast.success('País creado'); this.addingCountry.set(false); this.loadCountries(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al crear país'),
    });
  }

  startEditCountry(c: Country): void {
    this.editingCountryId.set(c.id);
    this.editCountryName = c.name;
  }

  cancelEditCountry(): void {
    this.editingCountryId.set(null);
  }

  saveEditCountry(c: Country): void {
    if (!this.editCountryName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.updateCountry(c.id, { name: this.editCountryName.trim() }).subscribe({
      next: () => { this.toast.success('País actualizado'); this.editingCountryId.set(null); this.loadCountries(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al actualizar país'),
    });
  }

  async deleteCountry(c: Country): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Eliminar país', message: `¿Eliminar "${c.name}"?`, danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.core.deleteCountry(c.id).subscribe({
      next: () => { this.toast.success('País eliminado'); this.loadCountries(); },
      error: () => this.toast.error('Error al eliminar país (tiene ciudades asociadas?)'),
    });
  }

  // Cities
  startAddCity(): void {
    this.addingCity.set(true);
    this.newCityName = '';
    this.newCityCountryId = null;
  }

  cancelAddCity(): void {
    this.addingCity.set(false);
  }

  saveCity(): void {
    if (!this.newCityName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    if (!this.newCityCountryId) { this.toast.error('Seleccione un país'); return; }
    this.core.createCity({ name: this.newCityName.trim(), country: this.newCityCountryId }).subscribe({
      next: () => { this.toast.success('Ciudad creada'); this.addingCity.set(false); this.loadCities(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al crear ciudad'),
    });
  }

  startEditCity(c: City): void {
    this.editingCityId.set(c.id);
    this.editCityName = c.name;
    this.editCityCountryId = c.country;
  }

  cancelEditCity(): void {
    this.editingCityId.set(null);
  }

  saveEditCity(c: City): void {
    if (!this.editCityName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.updateCity(c.id, { name: this.editCityName.trim(), country: this.editCityCountryId || c.country }).subscribe({
      next: () => { this.toast.success('Ciudad actualizada'); this.editingCityId.set(null); this.loadCities(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al actualizar ciudad'),
    });
  }

  async deleteCity(c: City): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Eliminar ciudad', message: `¿Eliminar "${c.name}"?`, danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.core.deleteCity(c.id).subscribe({
      next: () => { this.toast.success('Ciudad eliminada'); this.loadCities(); },
      error: () => this.toast.error('Error al eliminar ciudad (tiene barrios asociados?)'),
    });
  }

  // Neighborhoods
  startAddNeighborhood(): void {
    this.addingNeighborhood.set(true);
    this.newNeighborhoodName = '';
    this.newNHoodCityId = null;
  }

  cancelAddNeighborhood(): void {
    this.addingNeighborhood.set(false);
  }

  saveNeighborhood(): void {
    if (!this.newNeighborhoodName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    if (!this.newNHoodCityId) { this.toast.error('Seleccione una ciudad'); return; }
    this.core.createNeighborhood({ name: this.newNeighborhoodName.trim(), city: this.newNHoodCityId }).subscribe({
      next: () => { this.toast.success('Barrio creado'); this.addingNeighborhood.set(false); this.loadNeighborhoods(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al crear barrio'),
    });
  }

  startEditNeighborhood(n: Neighborhood): void {
    this.editingNHoodId.set(n.id);
    this.editNHoodName = n.name;
    this.editNHoodCityId = n.city;
  }

  cancelEditNeighborhood(): void {
    this.editingNHoodId.set(null);
  }

  saveEditNeighborhood(n: Neighborhood): void {
    if (!this.editNHoodName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.updateNeighborhood(n.id, { name: this.editNHoodName.trim(), city: this.editNHoodCityId || n.city }).subscribe({
      next: () => { this.toast.success('Barrio actualizado'); this.editingNHoodId.set(null); this.loadNeighborhoods(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al actualizar barrio'),
    });
  }

  async deleteNeighborhood(n: Neighborhood): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Eliminar barrio', message: `¿Eliminar "${n.name}"?`, danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.core.deleteNeighborhood(n.id).subscribe({
      next: () => { this.toast.success('Barrio eliminado'); this.loadNeighborhoods(); },
      error: () => this.toast.error('Error al eliminar barrio'),
    });
  }

  // Services
  startAddService(): void {
    this.addingService.set(true);
    this.newServiceName = '';
    this.newServiceDesc = '';
  }

  cancelAddService(): void {
    this.addingService.set(false);
  }

  saveService(): void {
    if (!this.newServiceName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.createService({ name: this.newServiceName.trim(), description: this.newServiceDesc.trim() }).subscribe({
      next: () => { this.toast.success('Servicio creado'); this.addingService.set(false); this.loadServices(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al crear servicio'),
    });
  }

  startEditService(s: ChurchService): void {
    this.editingServiceId.set(s.id);
    this.editServiceName = s.name;
    this.editServiceDesc = s.description;
  }

  cancelEditService(): void {
    this.editingServiceId.set(null);
  }

  saveEditService(s: ChurchService): void {
    if (!this.editServiceName.trim()) { this.toast.error('El nombre es obligatorio'); return; }
    this.core.updateService(s.id, { name: this.editServiceName.trim(), description: this.editServiceDesc.trim() }).subscribe({
      next: () => { this.toast.success('Servicio actualizado'); this.editingServiceId.set(null); this.loadServices(); },
      error: (e) => this.toast.error(e.error?.name?.[0] || 'Error al actualizar servicio'),
    });
  }

  async deleteService(s: ChurchService): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Eliminar servicio', message: `¿Eliminar "${s.name}"?`, danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.core.deleteService(s.id).subscribe({
      next: () => { this.toast.success('Servicio eliminado'); this.loadServices(); },
      error: () => this.toast.error('Error al eliminar servicio'),
    });
  }
}
