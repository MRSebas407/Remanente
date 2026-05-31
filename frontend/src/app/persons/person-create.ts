import { Component, inject, OnInit, output, signal, ElementRef, viewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { PersonService } from './person.service';
import { Country, City, Neighborhood, ChurchService } from './person.model';
import { ToastService } from '../shared/toast.service';
import { CoreManager } from '../shared/core-manager';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-person-create',
  standalone: true,
  imports: [FormsModule, NgIf, CoreManager],
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden" (click)="close.emit()">
  <div class="bg-accent shadow-xl w-full max-w-3xl mx-4 my-6 rounded-xl flex flex-col max-h-[calc(100vh-3rem)]" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">Registro de Persona</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 overflow-y-auto flex-1">
      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Nombres <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="names" name="names" required
              (input)="validateField('names')"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              [class.border-red-400]="fieldErrors['names']"
              placeholder="Nombres" />
            @if (fieldErrors['names']) { <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['names'] }}</p> }
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Apellidos <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="lastname" name="lastname" required
              (input)="validateField('lastname')"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              [class.border-red-400]="fieldErrors['lastname']"
              placeholder="Apellidos" />
            @if (fieldErrors['lastname']) { <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['lastname'] }}</p> }
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Cédula <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="document" name="document" required
              (input)="validateField('document')"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              [class.border-red-400]="fieldErrors['document']"
              placeholder="0000000000" />
            @if (fieldErrors['document']) { <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['document'] }}</p> }
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Teléfono <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="phone" name="phone" required
              (input)="validateField('phone')"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              [class.border-red-400]="fieldErrors['phone']"
              placeholder="3200000000" />
            @if (fieldErrors['phone']) { <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['phone'] }}</p> }
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button type="button" (click)="openCoreManager('countries')"
            class="text-xs px-3 py-1.5 bg-accent border border-theme rounded-lg hover:bg-accent-hover transition-colors text-secondary"
          >⚙ Administrar ubicaciones</button>
          <button type="button" (click)="openCoreManager('services')"
            class="text-xs px-3 py-1.5 bg-accent border border-theme rounded-lg hover:bg-accent-hover transition-colors text-secondary"
          >⚙ Administrar servicios</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">País <span class="text-red-500">*</span></label>
            <select [(ngModel)]="countryId" name="countryId" required (change)="onCountryChange()"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (c of countries; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Ciudad <span class="text-red-500">*</span></label>
            <select [(ngModel)]="cityId" name="cityId" required (change)="onCityChange()"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (c of cities; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Barrio <span class="text-red-500">*</span></label>
            <select [(ngModel)]="neighborhoodId" name="neighborhoodId" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (n of neighborhoods; track n.id) { <option [value]="n.id">{{ n.name }}</option> }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Servicio <span class="text-red-500">*</span></label>
            <select [(ngModel)]="serviceId" name="serviceId" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              @for (s of services; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-primary">Dirección</label>
          <textarea [(ngModel)]="address" name="address" rows="2"
            class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            placeholder="Dirección"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Género <span class="text-red-500">*</span></label>
            <select [(ngModel)]="gender" name="gender" required
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Especialidad <span class="text-red-500">*</span></label>
            <select [(ngModel)]="specialism" name="specialism" required (change)="onSpecialismChange()"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
              <option value="">Seleccionar</option>
              <option value="joven">Joven</option>
              <option value="normal">Normal</option>
              <option value="other_church">Otra Iglesia</option>
              <option value="distance">Distancia</option>
            </select>
          </div>
        </div>

        @if (specialism === 'other_church') {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Iglesia de procedencia</label>
              <input type="text" [(ngModel)]="comesFromChurch" name="comesFromChurch"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none"
                placeholder="Nombre de la iglesia" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Detalles</label>
              <textarea [(ngModel)]="comesFromDetails" name="comesFromDetails" rows="1"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none"
                placeholder="Detalles"></textarea>
            </div>
          </div>
        }

        <div>
          <label class="block text-sm font-medium mb-1 text-primary">Firma</label>
          <div class="flex flex-wrap gap-2 mb-2">
            <button type="button" (click)="setSigMode('draw')"
              class="text-xs px-3 py-1 rounded-lg border transition-colors"
              [class.bg-primary]="sigMode==='draw'" [class.text-on-primary]="sigMode==='draw'"
              [class.border-theme]="sigMode!=='draw'" [class.text-primary]="sigMode!=='draw'"
            >Dibujar</button>
            <button type="button" (click)="setSigMode('upload')"
              class="text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer"
              [class.bg-primary]="sigMode==='upload'" [class.text-on-primary]="sigMode==='upload'"
              [class.border-theme]="sigMode!=='upload'" [class.text-primary]="sigMode!=='upload'"
            >Subir imagen</button>
          </div>

          <div *ngIf="sigMode==='draw'">
            <div class="border border-theme rounded-lg overflow-hidden touch-none">
              <canvas #sigCanvas
                width="600" height="200"
                style="width:100%;height:200px;display:block;background:#fff;cursor:crosshair;"
                (mousedown)="startDraw($event)" (mousemove)="draw($event)" (mouseup)="stopDraw()" (mouseleave)="stopDraw()"
                (touchstart)="touchStart($event)" (touchmove)="touchMove($event)" (touchend)="stopDraw()"
              ></canvas>
            </div>
            <div class="flex gap-2 mt-1">
              <button type="button" (click)="clearSig()"
                class="text-xs px-3 py-1 rounded-lg border border-theme hover:bg-accent-hover transition-colors text-secondary"
              >Limpiar</button>
              @if (hasSignature) {
                <span class="text-xs text-green-600 self-center">Firma capturada</span>
              }
            </div>
          </div>

          <div *ngIf="sigMode==='upload'">
            <label class="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-theme cursor-pointer transition-all hover:bg-accent-hover relative overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Seleccionar archivo
              <input type="file" accept="image/*" (change)="onSigFile($event)" class="absolute inset-0 opacity-0 cursor-pointer text-[0]" />
            </label>
            <div *ngIf="sigFile" class="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="truncate">{{ sigFileName }}</span>
              <button type="button" (click)="removeSigFile()" class="ml-auto text-green-600 hover:text-green-800 shrink-0">&times;</button>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1 text-primary">Foto</label>
          <div class="flex flex-wrap gap-2">
            <button type="button" (click)="photoFileInput.click()"
              class="text-xs px-4 py-2 rounded-lg border border-theme cursor-pointer transition-all hover:bg-accent-hover text-primary"
            >Seleccionar foto</button>
            <button type="button" (click)="openCamera()"
              class="text-xs px-4 py-2 rounded-lg border border-theme cursor-pointer transition-all hover:bg-accent-hover text-primary flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Tomar foto
            </button>
          </div>
          <input #photoFileInput type="file" accept="image/*" class="hidden" (change)="onPhotoFile($event)" />

          @if (cameraOpen) {
            <div class="mt-3 p-3 border border-theme rounded-lg bg-secondary">
              <div class="relative max-w-xs mx-auto">
                <video #videoEl autoplay playsinline
                  class="w-full rounded-lg bg-black"
                  [class.hidden]="photoCaptured"
                ></video>
                @if (photoCaptured) {
                  <div class="max-w-xs border border-theme rounded-lg overflow-hidden">
                    <img [src]="photoPreviewUrl" class="w-full h-auto" />
                  </div>
                }
              </div>
              <div class="flex justify-center gap-3 mt-3">
                @if (!photoCaptured) {
                  <button type="button" (click)="capturePhoto()"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors"
                  >Capturar</button>
                }
                <button type="button" (click)="closeCamera()"
                  class="px-4 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
                >{{ photoCaptured ? 'Cancelar' : 'Cerrar cámara' }}</button>
                @if (photoCaptured) {
                  <button type="button" (click)="retakePhoto()"
                    class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors"
                  >Volver a tomar</button>
                }
              </div>
            </div>
          }

          <div class="mt-2" [style.display]="photoPreviewUrl && !cameraOpen ? 'block' : 'none'">
            <p class="text-xs text-secondary mb-1">Vista previa:</p>
            <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
              <img [src]="photoPreviewUrl" class="w-full h-auto block" />
            </div>
            <p class="text-xs text-green-600 mt-1">{{ photoFileName }}</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <input type="checkbox" [(ngModel)]="dataConsent" name="dataConsent" id="dataConsent"
            class="mt-0.5 rounded border-theme shrink-0" />
          <label for="dataConsent" class="text-sm text-primary">
            Doy consentimiento para el
            <a href="javascript:void(0)" (click)="showLawModal = true; $event.preventDefault()"
              class="text-blue-600 underline hover:text-blue-800">tratamiento de datos personales</a>
            <span class="text-red-500">*</span>
          </label>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="submit" [disabled]="loading()"
            class="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover"
          >{{ loading() ? 'Guardando...' : 'Guardar' }}</button>
          <button type="button" (click)="close.emit()"
            class="px-6 py-2.5 rounded-lg font-medium text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
          >Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</div>

@if (showLawModal) {
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" (click)="showLawModal = false">
    <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" (click)="$event.stopPropagation()">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-primary">Ley 1581 de 2012 - Protección de Datos Personales</h3>
        <button (click)="showLawModal = false" class="text-secondary hover:text-primary text-xl">&times;</button>
      </div>
      <div class="text-sm text-primary space-y-3 leading-relaxed">
        <p><strong>LEY ESTATUTARIA 1581 DE 2012</strong></p>
        <p><em>Por la cual se dictan disposiciones generales para la protección de datos personales.</em></p>

        <p><strong>Artículo 1°.</strong> La presente ley tiene por objeto desarrollar el derecho constitucional que tienen todas las personas a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ellas en bases de datos o archivos, y los demás derechos, libertades y garantías constitucionales a que se refiere el artículo 15 de la Constitución Política; así como el derecho a la información consagrado en el artículo 20 de la misma.</p>

        <p><strong>Artículo 2°.</strong> Los principios rectores de esta ley son:</p>
        <p><strong>a) Principio de legalidad:</strong> El tratamiento de datos personales es una actividad reglada que debe sujetarse a lo establecido en la presente ley y en las demás disposiciones que la desarrollen.</p>
        <p><strong>b) Principio de finalidad:</strong> El tratamiento de datos personales debe obedecer a una finalidad legítima de acuerdo con la Constitución y la ley, la cual debe ser informada al titular.</p>
        <p><strong>c) Principio de libertad:</strong> El tratamiento de datos personales solo puede ejercerse con el consentimiento previo, expreso e informado del titular.</p>
        <p><strong>d) Principio de veracidad o calidad:</strong> La información sujeta a tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible.</p>
        <p><strong>e) Principio de transparencia:</strong> En el tratamiento de datos personales debe garantizarse el derecho del titular a obtener del responsable o encargado, en cualquier momento, información acerca de la existencia de datos que le conciernan.</p>
        <p><strong>f) Principio de acceso y circulación restringida:</strong> Los datos personales, salvo la información pública, no podrán estar disponibles en internet o en otros medios de divulgación masiva, salvo que el acceso sea técnicamente controlable.</p>
        <p><strong>g) Principio de seguridad:</strong> La información sujeta a tratamiento debe ser manejada con las medidas técnicas, humanas y administrativas necesarias para otorgar seguridad a los registros evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.</p>
        <p><strong>h) Principio de confidencialidad:</strong> Todas las personas que intervengan en el tratamiento de datos personales están obligadas a garantizar la reserva de la información.</p>

        <p><strong>Artículo 3°.</strong> Para los efectos de la presente ley, se entiende por:</p>
        <p><strong>a) Autorización:</strong> Consentimiento previo, expreso e informado del titular para llevar a cabo el tratamiento de datos personales.</p>
        <p><strong>b) Base de datos:</strong> Conjunto organizado de datos personales que sea objeto de tratamiento.</p>
        <p><strong>c) Dato personal:</strong> Cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables.</p>
        <p><strong>d) Encargado del tratamiento:</strong> Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, realice el tratamiento de datos personales por cuenta del responsable del tratamiento.</p>
        <p><strong>e) Responsable del tratamiento:</strong> Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, decida sobre la base de datos y/o el tratamiento de los datos.</p>
        <p><strong>f) Titular:</strong> Persona natural cuyos datos personales sean objeto de tratamiento.</p>
        <p><strong>g) Tratamiento:</strong> Cualquier operación o conjunto de operaciones sobre datos personales, tales como recolección, almacenamiento, uso, circulación o supresión.</p>

        <p><strong>Artículo 4°.</strong> Los datos personales son de carácter privado y no podrán ser tratados sin la autorización del titular, salvo en los siguientes casos:</p>
        <p>a) Información requerida por una autoridad pública en ejercicio de sus funciones legales.</p>
        <p>b) Datos de naturaleza pública.</p>
        <p>c) Casos de urgencia médica o sanitaria.</p>
        <p>d) Tratamiento autorizado por la ley para fines históricos, estadísticos o científicos.</p>
        <p>e) Datos relativos al Registro Civil de las personas.</p>

        <p><strong>Artículo 5°.</strong> El titular de los datos personales tendrá los siguientes derechos:</p>
        <p>a) Conocer, actualizar y rectificar sus datos personales frente a los responsables o encargados del tratamiento.</p>
        <p>b) Solicitar prueba de la autorización otorgada.</p>
        <p>c) Ser informado por el responsable o encargado, previa solicitud, respecto del uso que le ha dado a sus datos personales.</p>
        <p>d) Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.</p>
        <p>e) Revocar la autorización y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</p>
        <p>f) Acceder en forma gratuita a sus datos personales.</p>
      </div>
    </div>
  </div>
}

@if (coreManagerTab()) {
  <app-core-manager [allowDelete]="isAdmin" [initialTab]="coreManagerTab()!" (close)="onCoreManagerClose()" />
}
`
})
export class PersonCreate implements OnInit {
  private service = inject(PersonService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  close = output<void>();
  saved = output<void>();

  isAdmin = this.auth.getUserRole() === 'Administrador';
  coreManagerTab = signal<string | null>(null);
  showLawModal = false;

  sigCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sigCanvas');
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  countries: Country[] = [];
  cities: City[] = [];
  neighborhoods: Neighborhood[] = [];
  services: ChurchService[] = [];

  loading = signal(false);

  names = '';
  lastname = '';
  document = '';
  phone = '';
  address = '';
  gender = '';
  specialism = '';
  comesFromChurch = '';
  comesFromDetails = '';
  countryId = 0;
  cityId = 0;
  neighborhoodId = 0;
  serviceId = 0;
  dataConsent = false;

  sigMode: 'draw' | 'upload' = 'draw';
  hasSignature = false;
  sigFile: File | null = null;
  sigFileName = '';

  photoFile: File | null = null;
  photoFileName = '';
  photoPreviewUrl = '';
  cameraOpen = false;
  photoCaptured = false;

  fieldErrors: Record<string, string> = {};

  private drawing = false;
  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.service.getCountries().subscribe(c => this.countries = c);
    this.service.getServices().subscribe(s => this.services = s);
  }

  onCountryChange(): void {
    this.cities = [];
    this.neighborhoods = [];
    this.cityId = 0;
    this.neighborhoodId = 0;
    if (this.countryId) this.service.getCities(this.countryId).subscribe(c => this.cities = c);
  }

  onCityChange(): void {
    this.neighborhoods = [];
    this.neighborhoodId = 0;
    if (this.cityId) this.service.getNeighborhoods(this.cityId).subscribe(n => this.neighborhoods = n);
  }

  onSpecialismChange(): void {
    if (this.specialism !== 'other_church') {
      this.comesFromChurch = '';
      this.comesFromDetails = '';
    }
  }

  openCoreManager(tab: string): void {
    this.coreManagerTab.set(tab);
  }

  onCoreManagerClose(): void {
    this.coreManagerTab.set(null);
    this.service.getCountries().subscribe(c => this.countries = c);
    this.service.getServices().subscribe(s => this.services = s);
  }

  setSigMode(mode: 'draw' | 'upload'): void {
    if (mode === 'draw') {
      this.sigMode = 'draw';
      this.sigFile = null;
      this.sigFileName = '';
    } else {
      this.sigMode = 'upload';
      this.clearSig();
      this.hasSignature = false;
    }
    this.cdr.detectChanges();
  }

  private getCtx(): CanvasRenderingContext2D | null {
    const el = this.sigCanvas();
    return el?.nativeElement.getContext('2d') ?? null;
  }

  private getPos(e: MouseEvent): { x: number; y: number } {
    const el = this.sigCanvas()!.nativeElement;
    const rect = el.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (el.width / rect.width), y: (e.clientY - rect.top) * (el.height / rect.height) };
  }

  startDraw(e: MouseEvent): void {
    this.drawing = true;
    const ctx = this.getCtx();
    if (!ctx) return;
    const pos = this.getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  draw(e: MouseEvent): void {
    if (!this.drawing) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const pos = this.getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#171717';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    this.hasSignature = true;
  }

  stopDraw(): void {
    this.drawing = false;
  }

  touchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.startDraw(touch as unknown as MouseEvent);
  }

  touchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.draw(touch as unknown as MouseEvent);
  }

  clearSig(): void {
    const ctx = this.getCtx();
    if (!ctx) return;
    const el = this.sigCanvas()!.nativeElement;
    ctx.clearRect(0, 0, el.width, el.height);
    this.hasSignature = false;
  }

  onSigFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.sigFile = file;
      this.sigFileName = file.name;
    }
  }

  removeSigFile(): void {
    this.sigFile = null;
    this.sigFileName = '';
  }

  onPhotoFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.photoFile = file;
      this.photoFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async openCamera(): Promise<void> {
    this.cameraOpen = true;
    this.photoCaptured = false;
    this.cdr.detectChanges();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.mediaStream = stream;
      const video = this.videoEl()?.nativeElement;
      if (video) {
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.videoWidth > 0) return resolve();
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
        await video.play();
      }
    } catch {
      this.toast.error('No se pudo acceder a la cámara');
      this.cameraOpen = false;
    }
  }

  capturePhoto(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) { requestAnimationFrame(() => this.capturePhoto()); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try { ctx.drawImage(video, 0, 0); } catch { requestAnimationFrame(() => this.capturePhoto()); return; }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.photoFile = this.dataUrlToFile(dataUrl, 'photo.jpg');
    this.photoFileName = 'photo.jpg';
    this.photoPreviewUrl = dataUrl;
    this.photoCaptured = true;
    this.cdr.detectChanges();
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
  }

  retakePhoto(): void {
    this.photoCaptured = false;
  }

  closeCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraOpen = false;
    this.photoCaptured = false;
  }

  private canvasToFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const el = this.sigCanvas();
      if (!el) return resolve(null);
      const canvas = el.nativeElement;
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], 'signature.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  validateField(field: string): void {
    switch (field) {
      case 'names':
        this.fieldErrors['names'] = this.names.trim() ? '' : 'El nombre es obligatorio';
        break;
      case 'lastname':
        this.fieldErrors['lastname'] = this.lastname.trim() ? '' : 'Los apellidos son obligatorios';
        break;
      case 'document':
        if (!this.document.trim()) {
          this.fieldErrors['document'] = 'La cédula es obligatoria';
        } else if (!/^\d{6,13}$/.test(this.document)) {
          this.fieldErrors['document'] = 'Debe contener solo números (6-13 dígitos)';
        } else {
          this.fieldErrors['document'] = '';
        }
        break;
      case 'phone':
        if (!this.phone.trim()) {
          this.fieldErrors['phone'] = 'El teléfono es obligatorio';
        } else if (!/^\d{7,10}$/.test(this.phone)) {
          this.fieldErrors['phone'] = 'Debe contener solo números (7-10 dígitos)';
        } else {
          this.fieldErrors['phone'] = '';
        }
        break;
    }
  }

  private validateAll(): boolean {
    this.validateField('names');
    this.validateField('lastname');
    this.validateField('document');
    this.validateField('phone');
    if (!this.countryId) this.toast.warning('Selecciona un país');
    if (!this.cityId) this.toast.warning('Selecciona una ciudad');
    if (!this.neighborhoodId) this.toast.warning('Selecciona un barrio');
    if (!this.serviceId) this.toast.warning('Selecciona un servicio');
    if (!this.gender) this.toast.warning('Selecciona un género');
    if (!this.specialism) this.toast.warning('Selecciona una especialidad');
    if (!this.dataConsent) this.toast.warning('Debes aceptar el consentimiento de datos');
    return !Object.values(this.fieldErrors).some(e => e !== '')
      && !!this.countryId && !!this.cityId && !!this.neighborhoodId
      && !!this.serviceId && !!this.gender && !!this.specialism && this.dataConsent;
  }

  async onSubmit(): Promise<void> {
    if (!this.validateAll()) return;
    this.loading.set(true);

    if (this.cameraOpen) this.closeCamera();

    let sigFile = this.sigFile;
    if (this.sigMode === 'draw') {
      sigFile = await this.canvasToFile();
    }

    const fd = new FormData();
    fd.append('names', this.names);
    fd.append('lastname', this.lastname);
    fd.append('document', this.document);
    fd.append('phone', this.phone);
    fd.append('address', this.address);
    fd.append('gender', this.gender);
    fd.append('specialism', this.specialism);
    fd.append('country', String(this.countryId));
    fd.append('city', String(this.cityId));
    fd.append('neighborhood', String(this.neighborhoodId));
    fd.append('church_service', String(this.serviceId));
    fd.append('data_consent', 'true');
    if (sigFile) fd.append('signature', sigFile);
    if (this.photoFile) fd.append('photo', this.photoFile);
    if (this.specialism === 'other_church') {
      fd.append('comes_from_church', this.comesFromChurch);
      fd.append('comes_from_details', this.comesFromDetails);
    }
    this.service.create(fd).subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.document?.[0] || err.error?.detail || 'Error al registrar persona';
        this.toast.error(msg);
      },
    });
  }
}
