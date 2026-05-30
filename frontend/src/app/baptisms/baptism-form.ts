import { Component, inject, input, output, signal, OnInit, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaptismService } from './baptism.service';
import { BaptismRegister, PendingPerson, TeacherEntry, Attendant, Calendar, Mode, ClassEntry } from './baptism.model';
import { BaptismManager } from './baptism-manager';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-baptism-form',
  standalone: true,
  imports: [FormsModule, BaptismManager],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="close.emit()">
      <div class="bg-accent rounded-xl border border-theme shadow-2xl p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-primary">{{ isEdit() ? 'Editar' : 'Nuevo' }} Registro de Bautizo</h3>
          <button (click)="close.emit()" class="text-secondary hover:text-primary text-xl">&times;</button>
        </div>

        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        } @else {
          <form (ngSubmit)="onSave()" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Persona</label>
              @if (isEdit()) {
                <p class="text-sm text-primary font-medium px-3 py-2 rounded-lg border border-theme bg-accent-hover/20">{{ editPersonName }}</p>
              } @else {
                <select [(ngModel)]="payload.person" name="person" required (change)="onPersonChange()"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option [value]="0">Seleccionar persona...</option>
                  @for (p of pendingPersons(); track p.person_id) {
                    <option [value]="p.person_id">{{ p.person_name }} ({{ p.document }})</option>
                  }
                </select>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Maestro</label>
              @if (isAdmin) {
                <div class="flex gap-2">
                  <select [(ngModel)]="payload.teacher" name="teacher" required
                    class="flex-1 px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                    <option [value]="0">Seleccionar maestro...</option>
                    @for (t of teachers(); track t.id) {
                      <option [value]="t.id">{{ t.full_name }} ({{ t.registration_count }})</option>
                    }
                  </select>
                  <button type="button" (click)="autoAssignTeacher()" title="Auto-asignar al que menos registros tenga"
                    class="px-3 py-2 rounded-lg text-xs border border-theme hover:bg-accent-hover text-secondary">Auto</button>
                </div>
              } @else {
                <p class="text-sm text-primary font-medium">{{ currentUserName }}</p>
              }
            </div>

            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-xs font-medium text-primary mb-0.5">Edad</label>
                <input type="number" [(ngModel)]="payload.age" name="age"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none" />
              </div>
              <div class="flex-1">
                <label class="block text-xs font-medium text-primary mb-0.5">Camiseta</label>
                <select [(ngModel)]="payload.shirt_size" name="shirt_size"
                  class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option value="">—</option>
                  <option value="XS">XS</option><option value="S">S</option><option value="M">M</option>
                  <option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Acudiente</label>
              <div class="flex gap-2">
                <select [(ngModel)]="payload.attendant" name="attendant"
                  class="flex-1 px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option [value]="0">Ninguno</option>
                  @for (a of personAttendants(); track a.id) {
                    <option [value]="a.id">{{ a.full_name }} — {{ a.phone }}</option>
                  }
                </select>
                <button type="button" (click)="managerTab = 0; showManager = true" title="Gestionar acudientes"
                  class="px-3 py-2 rounded-lg text-xs border border-theme hover:bg-accent-hover text-secondary">⚙</button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Clase</label>
              <div class="flex gap-2">
                <select [(ngModel)]="payload.class_ref" name="class_ref"
                  class="flex-1 px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                  <option [value]="0">Ninguna</option>
                  @for (cl of allClasses(); track cl.id) {
                    <option [value]="cl.id">{{ getClassLabel(cl) }}</option>
                  }
                </select>
                <button type="button" (click)="managerTab = 1; showManager = true" title="Gestionar clases"
                  class="px-3 py-2 rounded-lg text-xs border border-theme hover:bg-accent-hover text-secondary">⚙</button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Decisión de bautizo</label>
              <select [(ngModel)]="payload.baptism_decision" name="baptism_decision"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none">
                <option value="undecided">Indeciso</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Tiempo en la iglesia</label>
              <input type="text" [(ngModel)]="payload.time_in_church" name="time_in_church"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none"
                placeholder="Ej: 2 años" />
            </div>

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Foto</label>
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

            <div>
              <label class="block text-xs font-medium text-primary mb-0.5">Detalles</label>
              <textarea [(ngModel)]="payload.details" name="details" rows="3"
                class="w-full px-3 py-2 rounded-lg border border-theme bg-accent text-primary text-sm focus:outline-none resize-none"></textarea>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="payload.baptized" name="baptized" id="baptized"
                class="rounded border-theme" />
              <label for="baptized" class="text-sm text-primary">Ya bautizado</label>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" [disabled]="saving()"
                class="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-50"
              >{{ saving() ? 'Guardando...' : 'Guardar' }}</button>
              <button type="button" (click)="close.emit()"
                class="px-5 py-2 rounded-lg text-sm border border-theme hover:bg-accent-hover transition-colors text-secondary">Cancelar</button>
            </div>
          </form>
        }
      </div>
    </div>

    @if (showManager) {
      <app-baptism-manager [personId]="payload.person" [initialTab]="managerTab" (close)="showManager = false; reloadCatalogs()" />
    }
  `,
})
export class BaptismForm implements OnInit {
  private service = inject(BaptismService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  registerId = input<number | null>(null);
  close = output();
  saved = output();

  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  showManager = false;
  managerTab = 0;

  isAdmin = this.auth.getUserRole() === 'Administrador';
  currentUserName = this.auth.getUserName();
  currentAdviserId = this.auth.getAdviserId();

  pendingPersons = signal<PendingPerson[]>([]);
  teachers = signal<TeacherEntry[]>([]);
  personAttendants = signal<Attendant[]>([]);
  allClasses = signal<ClassEntry[]>([]);
  calendars = signal<Calendar[]>([]);
  modes = signal<Mode[]>([]);
  advisers = signal<any[]>([]);

  editPersonName = '';

  payload: any = {
    person: 0,
    teacher: 0,
    age: null,
    attendant: 0,
    class_ref: 0,
    baptism_decision: 'undecided',
    shirt_size: '',
    time_in_church: '',
    baptized: false,
    details: '',
    photo: null,
  };

  private photoFile: File | null = null;
  photoPreviewUrl = '';
  photoFileName = '';
  cameraOpen = false;
  photoCaptured = false;
  private mediaStream: MediaStream | null = null;
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('videoEl');

  ngOnInit(): void {
    if (this.registerId()) {
      this.isEdit.set(true);
      this.loading.set(true);
      this.service.get(this.registerId()!).subscribe({
        next: (r) => {
          this.editPersonName = r.person_name;
          this.payload.person = r.person;
          this.payload.teacher = r.teacher;
          this.payload.age = r.age;
          this.payload.attendant = r.attendant || 0;
          this.payload.class_ref = r.class_ref || 0;
          this.payload.baptism_decision = r.baptism_decision;
          this.payload.shirt_size = r.shirt_size;
          this.payload.time_in_church = r.time_in_church;
          this.payload.baptized = r.baptized;
          this.payload.details = r.details;
          this.loading.set(false);
          this.loadDependencies(true);
        },
        error: () => { this.toast.error('Error al cargar'); this.loading.set(false); },
      });
    } else {
      this.loadDependencies(false);
    }
  }

  private loadDependencies(isEdit: boolean): void {
    this.service.getPendingPersons().subscribe({ next: (r) => this.pendingPersons.set(r) });
    if (this.isAdmin) {
      this.service.getTeachers().subscribe({ next: (r) => this.teachers.set(r) });
    } else {
      this.service.getTeachers().subscribe({ next: (r) => {
        const me = r.find(t => t.full_name === this.currentUserName);
        if (me) this.payload.teacher = me.id;
        this.teachers.set(r);
      }});
    }
    this.loadAttendants();
    this.loadClasses();
    this.service.getCalendars().subscribe({ next: (r) => this.calendars.set(r) });
    this.service.getModes().subscribe({ next: (r) => this.modes.set(r) });
    this.service.getAdviserList().subscribe({ next: (r: any) => this.advisers.set(r.results || r) });
  }

  onPersonChange(): void {
    this.payload.attendant = 0;
    this.loadAttendants();
  }

  private loadAttendants(): void {
    const personId = this.payload.person;
    if (personId && personId > 0) {
      this.service.getAttendants(personId).subscribe({ next: (r) => this.personAttendants.set(r) });
    } else {
      this.personAttendants.set([]);
    }
  }

  reloadCatalogs(): void {
    this.loadAttendants();
    this.loadClasses();
    this.service.getCalendars().subscribe({ next: (r) => this.calendars.set(r) });
    this.service.getModes().subscribe({ next: (r) => this.modes.set(r) });
    this.service.getAdviserList().subscribe({ next: (r: any) => this.advisers.set(r.results || r) });
  }

  private loadClasses(): void {
    this.service.getClasses().subscribe({ next: (r) => this.allClasses.set(r) });
  }

  getClassLabel(cl: ClassEntry): string {
    const cal = this.calendars().find(c => c.id === cl.calendar);
    const mode = this.modes().find(m => m.id === cl.mode);
    const prof = this.advisers().find(a => a.id === cl.professor);
    const calStr = cal ? `${cal.day} ${cal.hour}` : '';
    const modeStr = mode ? mode.name : '';
    const profStr = prof ? prof.full_name : '';
    return [calStr, modeStr, profStr].filter(Boolean).join(' — ');
  }

  autoAssignTeacher(): void {
    if (this.teachers().length === 0) return;
    const sorted = [...this.teachers()].sort((a, b) => a.registration_count - b.registration_count);
    this.payload.teacher = sorted[0].id;
    this.toast.success(`Asignado a ${sorted[0].full_name}`);
  }

  onPhotoFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.photoFile = file;
    this.photoFileName = file.name;
    const reader = new FileReader();
    reader.onload = () => { this.photoPreviewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  openCamera(): void {
    this.cameraOpen = true;
    this.photoCaptured = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
      this.mediaStream = stream;
      setTimeout(() => {
        const video = this.videoEl()?.nativeElement;
        if (video) video.srcObject = stream;
      });
    }).catch(() => this.toast.error('No se pudo abrir la cámara'));
  }

  capturePhoto(): void {
    const video = this.videoEl()?.nativeElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      this.photoFile = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      this.photoFileName = 'photo.jpg';
      const reader = new FileReader();
      reader.onload = () => { this.photoPreviewUrl = reader.result as string; };
      reader.readAsDataURL(blob);
      this.photoCaptured = true;
    }, 'image/jpeg');
  }

  retakePhoto(): void {
    this.photoCaptured = false;
    this.photoFile = null;
    this.photoPreviewUrl = '';
    this.photoFileName = '';
  }

  closeCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraOpen = false;
    if (!this.photoCaptured) {
      this.photoFile = null;
      this.photoPreviewUrl = '';
      this.photoFileName = '';
    }
  }

  onSave(): void {
    if (!this.payload.person || !this.payload.teacher) {
      this.toast.error('Completa persona y maestro');
      return;
    }
    this.saving.set(true);
    if (this.photoFile) {
      const data: any = {
        person: this.payload.person,
        teacher: this.payload.teacher,
        age: this.payload.age || null,
        attendant: this.payload.attendant > 0 ? this.payload.attendant : null,
        class_ref: this.payload.class_ref > 0 ? this.payload.class_ref : null,
        baptism_decision: this.payload.baptism_decision,
        shirt_size: this.payload.shirt_size,
        time_in_church: this.payload.time_in_church,
        baptized: this.payload.baptized,
        details: this.payload.details,
        photo: this.photoFile,
      };
      const obs = this.isEdit()
        ? this.service.update(this.registerId()!, data)
        : this.service.create(data);
      obs.subscribe({
        next: () => { this.saving.set(false); this.saved.emit(); },
        error: () => { this.saving.set(false); this.toast.error('Error al guardar'); },
      });
    } else {
      this.submitWithoutPhoto();
    }
  }

  private submitWithoutPhoto(): void {
    const data: any = {
      person: this.payload.person,
      teacher: this.payload.teacher,
      age: this.payload.age || null,
      attendant: this.payload.attendant > 0 ? this.payload.attendant : null,
      class_ref: this.payload.class_ref > 0 ? this.payload.class_ref : null,
      baptism_decision: this.payload.baptism_decision,
      shirt_size: this.payload.shirt_size,
      time_in_church: this.payload.time_in_church,
      baptized: this.payload.baptized,
      details: this.payload.details,
    };
    const obs = this.isEdit()
      ? this.service.update(this.registerId()!, data)
      : this.service.create(data);
    obs.subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: () => { this.saving.set(false); this.toast.error('Error al guardar'); },
    });
  }
}
