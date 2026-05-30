import { Component, inject, OnInit, signal, ElementRef, viewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AdviserService } from './adviser.service';
import { Role, Specialism } from './adviser.model';
import { ToastService } from '../shared/toast.service';
import { LookupManager } from '../shared/lookup-manager';

@Component({
  selector: 'app-adviser-form',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf, LookupManager],
  template: `
    <div class="p-4 sm:p-6 max-w-2xl mx-auto">
        <div class="bg-accent rounded-xl border border-theme p-6">
          <h2 class="text-xl font-semibold text-primary mb-6">Registrar Asesor</h2>

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Nombres <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="names" name="names" required
                  (input)="validateField('names')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="fieldErrors['names']"
                  [class.border-theme]="!fieldErrors['names']"
                  placeholder="Nombres" />
                @if (fieldErrors['names']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['names'] }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Apellidos <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="lastName" name="lastName" required
                  (input)="validateField('lastName')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="fieldErrors['lastName']"
                  [class.border-theme]="!fieldErrors['lastName']"
                  placeholder="Apellidos" />
                @if (fieldErrors['lastName']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['lastName'] }}</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Cédula <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="document" name="document" required
                  (input)="validateField('document')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="fieldErrors['document']"
                  [class.border-theme]="!fieldErrors['document']"
                  placeholder="0000000000" />
                @if (fieldErrors['document']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['document'] }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Teléfono <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="phone" name="phone" required
                  (input)="validateField('phone')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="fieldErrors['phone']"
                  [class.border-theme]="!fieldErrors['phone']"
                  placeholder="3200000000" />
                @if (fieldErrors['phone']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['phone'] }}</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Usuario <span class="text-red-500">*</span></label>
                <input type="text" [(ngModel)]="username" name="username" required
                  (input)="validateField('username')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="fieldErrors['username']"
                  [class.border-theme]="!fieldErrors['username']"
                  placeholder="usuario" />
                @if (fieldErrors['username']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['username'] }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Contraseña <span class="text-red-500">*</span></label>
                <input type="password" [(ngModel)]="password" name="password" required
                  (input)="validateField('password')"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  [class.border-red-400]="password && !passwordValid"
                  [class.border-theme]="!password || passwordValid"
                  placeholder="••••••" />
                @if (password && !passwordValid) {
                  <ul class="mt-1 space-y-0.5">
                    <li class="text-xs" [class.text-green-600]="password.length >= 8" [class.text-red-500]="password.length > 0 && password.length < 8">
                      {{ password.length >= 8 ? '✓' : '○' }} Mínimo 8 caracteres
                    </li>
                    <li class="text-xs" [class.text-green-600]="hasUpper" [class.text-red-500]="password.length > 0 && !hasUpper">
                      {{ hasUpper ? '✓' : '○' }} Al menos una mayúscula
                    </li>
                    <li class="text-xs" [class.text-green-600]="hasLower" [class.text-red-500]="password.length > 0 && !hasLower">
                      {{ hasLower ? '✓' : '○' }} Al menos una minúscula
                    </li>
                    <li class="text-xs" [class.text-green-600]="hasNumber" [class.text-red-500]="password.length > 0 && !hasNumber">
                      {{ hasNumber ? '✓' : '○' }} Al menos un número
                    </li>
                    <li class="text-xs" [class.text-green-600]="hasSpecial" [class.text-red-500]="password.length > 0 && !hasSpecial">
                      {{ hasSpecial ? '✓' : '○' }} Al menos un carácter especial (!@#$%^&*)
                    </li>
                  </ul>
                }
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1 text-primary">Email <span class="text-red-500">*</span></label>
              <input type="email" [(ngModel)]="email" name="email" required
                (input)="validateField('email')"
                class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                [class.border-red-400]="fieldErrors['email']"
                [class.border-theme]="!fieldErrors['email']"
                placeholder="correo@ejemplo.com" />
              @if (email && !emailValid) {
                <p class="text-xs text-red-500 mt-0.5">Formato de correo inválido</p>
              }
              @if (fieldErrors['email']) {
                <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['email'] }}</p>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Género <span class="text-red-500">*</span></label>
                <select [(ngModel)]="gender" name="gender"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Rol <span class="text-red-500">*</span></label>
                <select [(ngModel)]="roleId" name="roleId" required (change)="onRoleChange()"
                  class="w-full px-3 py-2 rounded-lg border bg-accent text-primary text-sm focus:outline-none"
                  [class.border-red-400]="fieldErrors['roleId']"
                  [class.border-theme]="!fieldErrors['roleId']">
                  <option value="">Seleccionar</option>
                  @for (r of roles; track r.id) {
                    <option [value]="r.id">{{ r.name }}</option>
                  }
                </select>
                @if (fieldErrors['roleId']) {
                  <p class="text-xs text-red-500 mt-0.5">{{ fieldErrors['roleId'] }}</p>
                }
              </div>
            </div>

            @if (roleId) {
              <div>
                <label class="block text-sm font-medium mb-1 text-primary">Especialidad</label>
                <select [(ngModel)]="specialismId" name="specialismId"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option [value]="null">Sin especialidad</option>
                  @for (s of specialisms; track s.id) {
                    <option [value]="s.id">{{ s.name }}</option>
                  }
                </select>
              </div>
            }

            <button type="button" (click)="showLookupManager.set(true)"
              class="text-xs px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            >⚙ Administrar roles y especialidades</button>

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

              <div class="mt-2" [style.display]="photoPreviewUrl && !cameraOpen ? 'block' : 'none'">
                <p class="text-xs text-secondary mb-1">Vista previa:</p>
                <div class="max-w-48 border border-theme rounded-lg overflow-hidden">
                  <img [src]="photoPreviewUrl" class="w-full h-auto block" />
                </div>
                <p class="text-xs text-green-600 mt-1">{{ photoFileName }}</p>
              </div>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="loading()"
                class="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-primary text-on-primary hover:bg-primary-hover"
              >{{ loading() ? 'Guardando...' : 'Guardar' }}</button>
              <a routerLink="/"
                class="px-6 py-2.5 rounded-lg font-medium text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary inline-block"
              >Cancelar</a>
            </div>
          </form>
        </div>
    </div>

    @if (showLookupManager()) {
      <app-lookup-manager (close)="onLookupManagerClose()" />
    }
  `,
})
export class AdviserForm implements OnInit {
  private service = inject(AdviserService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  sigCanvas = viewChild<ElementRef<HTMLCanvasElement>>('sigCanvas');
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  roles: Role[] = [];
  specialisms: Specialism[] = [];
  loading = signal(false);

  username = '';
  email = '';
  password = '';
  names = '';
  lastName = '';
  document = '';
  phone = '';
  gender = 'M';
  roleId: number | null = null;
  specialismId: number | null = null;

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

  fieldErrors: Record<string, string> = {};
  emailValid = true;
  passwordValid = true;
  hasUpper = false;
  hasLower = false;
  hasNumber = false;
  hasSpecial = false;
  showLookupManager = signal(false);

  private drawing = false;
  private mediaStream: MediaStream | null = null;

  ngOnInit(): void {
    this.service.getRoles().subscribe({ next: (r) => { this.roles = r; this.cdr.detectChanges(); } });
    this.service.getSpecialisms().subscribe({ next: (s) => { this.specialisms = s; this.cdr.detectChanges(); } });
  }

  onLookupManagerClose(): void {
    this.showLookupManager.set(false);
    this.service.getRoles().subscribe({ next: (r) => { this.roles = r; this.cdr.detectChanges(); } });
    this.service.getSpecialisms().subscribe({ next: (s) => { this.specialisms = s; this.cdr.detectChanges(); } });
  }

  onRoleChange(): void {
    if (this.roleId && this.roles.find(r => r.id === this.roleId)?.name === 'Administrador') {
      this.specialismId = null;
    }
  }

  validateField(field: string): void {

    switch (field) {
      case 'names':
        this.fieldErrors['names'] = this.names.trim() ? '' : 'El nombre es obligatorio';
        break;
      case 'lastName':
        this.fieldErrors['lastName'] = this.lastName.trim() ? '' : 'Los apellidos son obligatorios';
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
      case 'username':
        if (!this.username.trim()) {
          this.fieldErrors['username'] = 'El usuario es obligatorio';
        } else if (this.username.length < 3) {
          this.fieldErrors['username'] = 'Mínimo 3 caracteres';
        } else {
          this.fieldErrors['username'] = '';
        }
        break;
      case 'email':
        this.emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
        if (!this.email.trim()) {
          this.fieldErrors['email'] = 'El correo es obligatorio';
        } else if (!this.emailValid) {
          this.fieldErrors['email'] = 'Formato de correo inválido';
        } else {
          this.fieldErrors['email'] = '';
        }
        break;
      case 'password':
        this.hasUpper = /[A-Z]/.test(this.password);
        this.hasLower = /[a-z]/.test(this.password);
        this.hasNumber = /\d/.test(this.password);
        this.hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(this.password);
        this.passwordValid = this.password.length >= 8 && this.hasUpper && this.hasLower && this.hasNumber && this.hasSpecial;
        if (this.password && !this.passwordValid) {
          this.fieldErrors['password'] = 'La contraseña no cumple los requisitos';
        } else {
          this.fieldErrors['password'] = '';
        }
        break;
      case 'roleId':
        this.fieldErrors['roleId'] = this.roleId ? '' : 'Selecciona un rol';
        break;
    }
  }

  setMode(mode: 'draw' | 'upload'): void {
    if (mode === 'draw') {
      this.sigMode = 'draw';
      this.sigFile = null;
      this.sigFileName = '';
      this.sigPreviewUrl = '';
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
    this.sigPreviewUrl = '';
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
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.cdr.detectChanges();
      const video = this.videoEl()?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
      }
    } catch {
      this.cameraOpen = false;
      this.toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  capturePhoto(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      this.photoFile = file;
      this.photoFileName = file.name;
      this.photoCaptured = true;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }, 'image/jpeg', 0.92);
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

  private validateAll(): boolean {
    this.validateField('names');
    this.validateField('lastName');
    this.validateField('document');
    this.validateField('phone');
    this.validateField('username');
    this.validateField('email');
    this.validateField('password');
    this.validateField('roleId');
    return !Object.values(this.fieldErrors).some(e => e !== '');
  }

  async onSubmit(): Promise<void> {
    if (!this.validateAll()) {
      this.toast.warning('Corrige los errores en el formulario antes de guardar.');
      return;
    }

    this.loading.set(true);

    if (this.cameraOpen) {
      this.closeCamera();
    }

    let sigFile = this.sigFile;
    if (this.sigMode === 'draw') {
      sigFile = await this.canvasToFile();
    }

    this.service.create({
      username: this.username,
      email: this.email,
      password: this.password,
      names: this.names,
      last_name: this.lastName,
      document: this.document,
      phone: this.phone,
      gender: this.gender,
      role_id: this.roleId!,
      specialism_id: this.specialismId,
      signature: sigFile ?? undefined,
      photo: this.photoFile ?? undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Asesor registrado correctamente');
        this.resetForm();
      },
      error: (err) => {
        this.loading.set(false);
        const msgs = this.parseApiError(err);
        msgs.forEach(m => this.toast.error(m));
      },
    });
  }

  private parseApiError(err: any): string[] {
    const messages: string[] = [];
    if (err.status === 0) {
      messages.push('No se pudo conectar con el servidor. Verifica tu conexión.');
      return messages;
    }
    if (err.status === 401) {
      messages.push('Sesión expirada. Inicia sesión nuevamente.');
      return messages;
    }
    if (err.status === 403) {
      messages.push('No tienes permisos para realizar esta acción.');
      return messages;
    }

    const data = err.error;
    if (!data) {
      messages.push('Error inesperado del servidor.');
      return messages;
    }

    if (typeof data === 'string') {
      messages.push(data);
      return messages;
    }

    if (Array.isArray(data)) {
      data.forEach((m: any) => messages.push(typeof m === 'string' ? m : JSON.stringify(m)));
      return messages;
    }

    const fieldLabels: Record<string, string> = {
      username: 'Usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      names: 'Nombres',
      last_name: 'Apellidos',
      document: 'Cédula',
      phone: 'Teléfono',
      gender: 'Género',
      role_id: 'Rol',
      specialism_id: 'Especialidad',
      signature: 'Firma',
      photo: 'Foto',
      non_field_errors: '',
    };

    for (const [key, value] of Object.entries(data)) {
      const label = fieldLabels[key] || key;
      const prefix = label ? `${label}: ` : '';
      const val = value as any;
      if (Array.isArray(val)) {
        val.forEach((m: string) => messages.push(`${prefix}${m}`));
      } else if (typeof val === 'string') {
        messages.push(`${prefix}${val}`);
      }
    }

    return messages.length ? messages : ['Error inesperado del servidor.'];
  }

  private resetForm(): void {
    this.username = ''; this.email = ''; this.password = '';
    this.names = ''; this.lastName = ''; this.document = ''; this.phone = '';
    this.roleId = null; this.specialismId = null;
    this.clearSig();
    this.sigFile = null; this.sigFileName = ''; this.sigPreviewUrl = '';
    this.photoFile = null; this.photoFileName = ''; this.photoPreviewUrl = '';
    this.cameraOpen = false;
    this.photoCaptured = false;
    this.fieldErrors = {};
    this.emailValid = true;
    this.passwordValid = true;
  }
}
