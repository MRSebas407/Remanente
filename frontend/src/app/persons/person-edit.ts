import { Component, inject, input, output, OnInit, signal, ElementRef, viewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { PersonService } from './person.service';
import { PersonDetail, Country, City, Neighborhood, ChurchService } from './person.model';
import { ToastService } from '../shared/toast.service';
import { CoreManager } from '../shared/core-manager';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-person-edit',
  standalone: true,
  imports: [FormsModule, NgIf, CoreManager],
  template: `
<div class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-hidden" (click)="close.emit()">
  <div class="bg-accent shadow-xl w-full max-w-3xl mx-4 my-6 rounded-xl flex flex-col max-h-[calc(100vh-3rem)]" (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center p-4 border-b border-theme">
      <h2 class="text-lg font-bold text-primary">Editar Persona</h2>
      <button class="text-secondary hover:text-primary text-2xl leading-none" (click)="close.emit()">&times;</button>
    </div>
    <div class="p-4 overflow-y-auto flex-1">
      @if (loading()) {
        <div class="flex justify-center py-8">
          <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <form (ngSubmit)="onSave()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Nombres <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="names" name="names" required
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Apellidos <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="lastname" name="lastname" required
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Cédula <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="document" name="document" required
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Teléfono <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="phone" name="phone" required
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
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
              <label class="block text-sm font-medium mb-1 text-primary">País</label>
              <select [(ngModel)]="countryId" name="countryId"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                @for (c of countries; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Ciudad</label>
              <select [(ngModel)]="cityId" name="cityId"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                @for (c of cities; track c.id) { <option [value]="c.id">{{ c.name }}</option> }
              </select>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Barrio</label>
              <select [(ngModel)]="neighborhoodId" name="neighborhoodId"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                @for (n of neighborhoods; track n.id) { <option [value]="n.id">{{ n.name }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Servicio</label>
              <select [(ngModel)]="serviceId" name="serviceId"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                @for (s of services; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-primary">Dirección</label>
            <textarea [(ngModel)]="address" name="address" rows="2"
              class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Género</label>
              <select [(ngModel)]="gender" name="gender"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Especialidad</label>
              <select [(ngModel)]="specialism" name="specialism"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="joven">Joven</option>
                <option value="normal">Normal</option>
                <option value="other_church">Otra Iglesia</option>
                <option value="distance">Distancia</option>
              </select>
            </div>
          </div>

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

            @if (existingSignature && !sigFile) {
              <div class="mb-2">
                <p class="text-xs text-secondary mb-1">Firma actual:</p>
                <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                  <img [src]="existingSignature" class="w-full h-auto block" />
                </div>
              </div>
            }

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
                  <span class="text-xs text-green-600 self-center">Firma</span>
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

            @if (existingPhoto || (photoPreviewUrl && !cameraOpen)) {
              <div class="mt-2">
                <p class="text-xs text-secondary mb-1">Vista previa:</p>
                <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                  <img [src]="photoPreviewUrl || existingPhoto" class="w-full h-auto block" />
                </div>
              </div>
            }
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" [disabled]="saving()"
              class="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover"
            >{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
            <button type="button" (click)="close.emit()"
              class="px-6 py-2.5 rounded-lg font-medium text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
            >Cancelar</button>
          </div>
        </form>
      }
    </div>
  </div>
</div>

@if (coreManagerTab()) {
  <app-core-manager [allowDelete]="isAdmin" [initialTab]="coreManagerTab()!" (close)="onCoreManagerClose()" />
}
`
})
export class PersonEdit implements OnInit {
  private service = inject(PersonService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  personId = input.required<number>();
  close = output<void>();
  saved = output<void>();

  isAdmin = this.auth.getUserRole() === 'Administrador';
  coreManagerTab = signal<string | null>(null);

  sigCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sigCanvas');
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  loading = signal(false);
  saving = signal(false);

  names = '';
  lastname = '';
  document = '';
  phone = '';
  address = '';
  gender = '';
  specialism = '';
  countryId = 0;
  cityId = 0;
  neighborhoodId = 0;
  serviceId = 0;

  existingSignature = '';
  existingPhoto = '';

  sigMode: 'draw' | 'upload' = 'draw';
  hasSignature = false;
  sigFile: File | null = null;
  sigFileName = '';

  photoFile: File | null = null;
  photoFileName = '';
  photoPreviewUrl = '';
  cameraOpen = false;
  photoCaptured = false;

  countries: Country[] = [];
  cities: City[] = [];
  neighborhoods: Neighborhood[] = [];
  services: ChurchService[] = [];

  private drawing = false;
  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.service.getCountries().subscribe(c => { this.countries = c; });
    this.service.getServices().subscribe(s => { this.services = s; });
    this.loadDetail();
  }

  loadDetail(): void {
    this.loading.set(true);
    this.service.get(this.personId()).subscribe({
      next: (d) => {
        this.names = d.names;
        this.lastname = d.lastname;
        this.document = d.document;
        this.phone = d.phone;
        this.address = d.address || '';
        this.gender = d.gender || '';
        this.specialism = d.specialism || '';
        this.countryId = d.country;
        this.cityId = d.city;
        this.neighborhoodId = d.neighborhood;
        this.serviceId = d.church_service;
        this.existingSignature = d.signature || '';
        this.existingPhoto = d.photo || '';
        this.loading.set(false);
        this.loadCities();
        this.loadNeighborhoods();
      },
      error: () => { this.loading.set(false); this.toast.error('Error al cargar datos'); this.close.emit(); },
    });
  }

  loadCities(): void {
    if (this.countryId) this.service.getCities(this.countryId).subscribe(c => this.cities = c);
  }

  loadNeighborhoods(): void {
    if (this.cityId) this.service.getNeighborhoods(this.cityId).subscribe(n => this.neighborhoods = n);
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
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.videoEl()?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
        await new Promise<void>((resolve) => {
          if (video.videoWidth > 0) return resolve();
          video.addEventListener('loadedmetadata', () => resolve(), { once: true });
        });
        await video.play();
      }
    } catch {
      this.cameraOpen = false;
      this.toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
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

  onSave(): void {
    this.saving.set(true);

    if (this.cameraOpen) this.closeCamera();

    this.canvasToFile().then(async (sigFile) => {
      const finalSig = sigFile || this.sigFile;

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
      if (finalSig) fd.append('signature', finalSig);
      if (this.photoFile) fd.append('photo', this.photoFile);
      this.service.update(this.personId(), fd).subscribe({
        next: () => { this.saving.set(false); this.saved.emit(); },
        error: () => { this.saving.set(false); this.toast.error('Error al actualizar persona'); },
      });
    });
  }
}
