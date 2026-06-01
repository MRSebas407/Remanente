import { Component, inject, input, output, OnInit, signal, ElementRef, viewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AdviserService } from './adviser.service';
import { Role, Specialism, AdviserDetail } from './adviser.model';
import { ToastService } from '../shared/toast.service';
import { LookupManager } from '../shared/lookup-manager';

@Component({
  selector: 'app-adviser-edit',
  standalone: true,
  imports: [FormsModule, NgIf, LookupManager],
  template: `
    <div class="fixed inset-0 z-40 flex items-start justify-center pt-4 pb-4 overflow-auto">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-2xl w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">Editar Asesor</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        @if (loadingDetail()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <form (ngSubmit)="onSave()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Nombres</label>
                <input type="text" [(ngModel)]="names" name="names" required
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Apellidos</label>
                <input type="text" [(ngModel)]="lastName" name="lastName" required
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Cédula</label>
                <input type="text" [(ngModel)]="document" name="document" required
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Teléfono</label>
                <input type="text" [(ngModel)]="phone" name="phone" required
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Roles</label>
                <div class="flex flex-wrap gap-3 mt-1">
                  @for (r of roles; track r.id) {
                    <label class="flex items-center gap-1.5 text-sm text-primary cursor-pointer">
                      <input type="checkbox" [value]="r.id"
                        [checked]="roleIds.includes(r.id)"
                        (change)="toggleRole(r.id)"
                        class="rounded border-theme" />
                      {{ r.name }}
                    </label>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Especialidad</label>
                <select [(ngModel)]="specialismId" name="specialismId"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option [value]="null">Sin especialidad</option>
                  @for (s of specialisms; track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>
            </div>

            <button type="button" (click)="showLookupManager.set(true)"
              class="text-xs px-3 py-1.5 bg-accent border border-theme rounded-lg hover:bg-accent-hover transition-colors text-secondary"
            >⚙ Administrar roles y especialidades</button>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-primary mb-0.5">Género</label>
                <select [(ngModel)]="gender" name="gender"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div class="flex items-end pb-1">
                <label class="flex items-center gap-2 text-sm text-primary cursor-pointer">
                  <input type="checkbox" [(ngModel)]="isActive" name="isActive"
                    class="rounded border-theme" />
                  Activo
                </label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Firma</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <button type="button" (click)="setMode('draw')"
                  class="text-xs px-3 py-1 rounded-lg border transition-colors"
                  [class.bg-primary]="sigMode==='draw'" [class.text-on-primary]="sigMode==='draw'"
                  [class.border-theme]="sigMode!=='draw'"
                >Dibujar</button>
                <button type="button" (click)="setMode('upload')"
                  class="text-xs px-3 py-1 rounded-lg border transition-colors cursor-pointer"
                  [class.bg-primary]="sigMode==='upload'" [class.text-on-primary]="sigMode==='upload'"
                  [class.border-theme]="sigMode!=='upload'"
                >Subir imagen</button>
              </div>

              @if (existingSignatureUrl && !sigFile) {
                <div class="mb-2">
                  <p class="text-xs text-secondary mb-1">Firma actual:</p>
                  <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                    <img [src]="existingSignatureUrl" class="w-full h-auto block" />
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
                  class="text-xs px-4 py-2 rounded-lg border border-theme cursor-pointer transition-all hover:bg-accent-hover active:scale-95"
                >Seleccionar foto</button>
                <button type="button" (click)="openCamera()"
                  class="text-xs px-4 py-2 rounded-lg border border-theme cursor-pointer transition-all hover:bg-accent-hover active:scale-95 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Tomar foto
                </button>
              </div>
              <input #photoFileInput type="file" accept="image/*" class="hidden" (change)="onPhotoFile($event)" />

              @if (existingPhotoUrl && !photoFile) {
                <div class="mt-2">
                  <p class="text-xs text-secondary mb-1">Foto actual:</p>
                  <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                    <img [src]="existingPhotoUrl" class="w-full h-auto block" />
                  </div>
                </div>
              }

              @if (cameraOpen) {
                <div class="mt-3 p-3 border border-theme rounded-lg bg-black/5">
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

              <div class="mt-2" [style.display]="photoPreviewUrl && photoFile && !cameraOpen ? 'block' : 'none'">
                <p class="text-xs text-secondary mb-1">Vista previa:</p>
                <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                  <img [src]="photoPreviewUrl" class="w-full h-auto block" />
                </div>
                <p class="text-xs text-green-600 mt-1">{{ photoFileName }}</p>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="saving()"
                class="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              >{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
              <button type="button" (click)="close.emit()"
                class="px-5 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary"
              >Cancelar</button>
            </div>
          </form>
        }
      </div>
    </div>

    @if (showLookupManager()) {
      <app-lookup-manager (close)="onLookupManagerClose()" />
    }
  `,
})
export class AdviserEdit implements OnInit {
  private service = inject(AdviserService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  adviserId = input.required<number>();
  close = output();
  saved = output();

  sigCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sigCanvas');
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  roles: Role[] = [];
  specialisms: Specialism[] = [];
  loadingDetail = signal(false);
  saving = signal(false);
  showLookupManager = signal(false);

  names = '';
  lastName = '';
  document = '';
  phone = '';
  gender = 'M';
  roleIds: number[] = [];
  specialismId: number | null = null;
  isActive = true;

  existingPhotoUrl = '';
  existingSignatureUrl = '';

  sigMode: 'draw' | 'upload' = 'draw';
  hasSignature = false;
  sigFile: File | null = null;
  sigFileName = '';
  sigPreviewUrl = '';

  photoFile: File | null = null;
  photoFileName = '';
  photoPreviewUrl = '';

  cameraOpen = false;
  photoCaptured = false;

  private drawing = false;
  private lastX = 0;
  private lastY = 0;

  ngOnInit(): void {
    this.service.getRoles().subscribe({ next: (r) => { this.roles = r; this.loadDetail(); } });
    this.service.getSpecialisms().subscribe({ next: (s) => { this.specialisms = s; } });
  }

  loadDetail(): void {
    this.loadingDetail.set(true);
    this.service.get(this.adviserId()).subscribe({
      next: (d) => {
        this.names = d.profile.names;
        this.lastName = d.profile.last_name;
        this.document = d.profile.document;
        this.phone = d.profile.phone;
        this.gender = d.profile.gender;
        this.roleIds = d.roles.map(r => r.id);
        this.specialismId = d.specialism?.id ?? null;
        this.isActive = d.is_active;
        this.existingPhotoUrl = d.profile.photo || '';
        this.existingSignatureUrl = d.signature || '';
        this.loadingDetail.set(false);
      },
      error: () => {
        this.loadingDetail.set(false);
        this.toast.error('Error al cargar datos del asesor');
        this.close.emit();
      },
    });
  }

  onLookupManagerClose(): void {
    this.showLookupManager.set(false);
    this.service.getRoles().subscribe({ next: (r) => { this.roles = r; } });
    this.service.getSpecialisms().subscribe({ next: (s) => { this.specialisms = s; } });
  }

  onSave(): void {
    this.saving.set(true);
    this.canvasToFile().then((sigFile) => {
      const finalSig = sigFile || this.sigFile;
      const fd = new FormData();
      fd.append('names', this.names);
      fd.append('last_name', this.lastName);
      fd.append('document', this.document);
      fd.append('phone', this.phone);
      fd.append('gender', this.gender);
      this.roleIds.forEach(id => fd.append('role_ids', String(id)));
      fd.append('specialism_id', this.specialismId != null ? String(this.specialismId) : '');
      fd.append('is_active', String(this.isActive));
      if (this.photoFile) fd.append('photo', this.photoFile);
      if (finalSig) fd.append('signature', finalSig);
      this.service.update(this.adviserId(), fd).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Error al actualizar asesor');
        },
      });
    });
  }

  toggleRole(roleId: number): void {
    const idx = this.roleIds.indexOf(roleId);
    if (idx >= 0) {
      this.roleIds.splice(idx, 1);
    } else {
      this.roleIds.push(roleId);
    }
  }

  private canvasToFile(): Promise<File | null> {
    return new Promise((resolve) => {
      const el = this.sigCanvas();
      if (!el || !this.hasSignature) return resolve(null);
      const canvas = el.nativeElement;
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        resolve(new File([blob], 'signature.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  // ── Signature ──

  setMode(m: 'draw' | 'upload'): void {
    this.sigMode = m;
  }

  startDraw(e: MouseEvent): void {
    this.drawing = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.lastX = e.clientX - rect.left;
    this.lastY = e.clientY - rect.top;
  }

  draw(e: MouseEvent): void {
    if (!this.drawing) return;
    const canvas = this.sigCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  stopDraw(): void {
    this.drawing = false;
  }

  touchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = this.sigCanvas()?.nativeElement;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
    this.drawing = true;
  }

  touchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing) return;
    const touch = e.touches[0];
    const canvas = this.sigCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    this.lastX = x;
    this.lastY = y;
    this.hasSignature = true;
  }

  clearSig(): void {
    const canvas = this.sigCanvas()?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasSignature = false;
    this.sigFile = null;
    this.sigFileName = '';
  }

  onSigFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.sigFile = input.files[0];
      this.sigFileName = input.files[0].name;
    }
  }

  removeSigFile(): void {
    this.sigFile = null;
    this.sigFileName = '';
  }

  // ── Photo ──

  onPhotoFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.photoFile = input.files[0];
    this.photoFileName = input.files[0].name;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }

  async openCamera(): Promise<void> {
    this.cameraOpen = true;
    this.photoCaptured = false;
    this.cdr.detectChanges();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.videoEl()?.nativeElement;
      if (video) video.srcObject = stream;
    } catch {
      this.toast.error('No se pudo acceder a la cámara');
      this.cameraOpen = false;
    }
  }

  capturePhoto(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      ctx.drawImage(video, 0, 0);
    } catch {
      requestAnimationFrame(() => {
        try {
          ctx.drawImage(video, 0, 0);
        } catch {}
      });
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const blob = this.dataUrlToBlob(dataUrl);
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    this.photoFile = file;
    this.photoFileName = file.name;
    this.photoCaptured = true;
    this.photoPreviewUrl = dataUrl;
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)![1];
    const raw = atob(parts[1]);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      arr[i] = raw.charCodeAt(i);
    }
    return new Blob([arr], { type: mime });
  }

  closeCamera(): void {
    this.cameraOpen = false;
    this.photoCaptured = false;
    const video = this.videoEl()?.nativeElement;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  }

  retakePhoto(): void {
    this.photoCaptured = false;
    this.photoFile = null;
    this.photoFileName = '';
    this.photoPreviewUrl = '';
  }
}
