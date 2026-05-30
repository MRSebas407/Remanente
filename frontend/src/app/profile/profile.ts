import { Component, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../shared/toast.service';
import { ProfileEdit } from './profile-edit';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileEdit],
  template: `
    <div class="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-semibold text-primary">Mi Perfil</h2>
          <span class="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{{ roleName }}</span>
        </div>
        <button (click)="editOpen.set(true)"
          class="text-xs px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-hover transition-colors"
        >Editar perfil</button>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      } @else {
        <div class="bg-accent rounded-xl border border-theme p-6 space-y-5">
          <div class="flex items-start gap-6">
            @if (photo()) {
              <div class="w-24 h-24 rounded-xl border border-theme overflow-hidden shrink-0">
                <img [src]="photo()" class="w-full h-full object-cover" />
              </div>
            } @else {
              <div class="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center text-3xl text-primary font-bold shrink-0">
                {{ initials }}
              </div>
            }
            <div class="space-y-1 pt-1">
              <h3 class="text-lg font-semibold text-primary">{{ names }} {{ lastName }}</h3>
              <p class="text-sm text-secondary">{{ roleName }}</p>
              @if (signature()) {
                <div class="mt-2 max-w-48 border border-theme rounded-lg overflow-hidden bg-white p-1">
                  <img [src]="signature()" class="w-full h-auto block" />
                </div>
              }
            </div>
          </div>

          <hr class="border-theme">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-0.5">Cédula</label>
              <p class="text-primary font-medium">{{ document }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-0.5">Teléfono</label>
              <p class="text-primary font-medium">{{ phone }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-0.5">Género</label>
              <p class="text-primary font-medium">{{ gender === 'M' ? 'Masculino' : 'Femenino' }}</p>
            </div>
          </div>
        </div>

        <div class="bg-accent rounded-xl border border-theme p-6 space-y-4">
          <h3 class="text-sm font-medium text-secondary uppercase tracking-wide">Cuenta</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-0.5">Usuario</label>
              <p class="text-primary font-medium">{{ username }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-secondary uppercase tracking-wide mb-0.5">Email</label>
              <p class="text-primary font-medium">{{ email }}</p>
            </div>
          </div>
          <p class="text-xs text-secondary">Los datos de cuenta solo pueden ser modificados por el administrador.</p>
        </div>
      }
    </div>

    @if (editOpen()) {
      <app-profile-edit (close)="editOpen.set(false)" (saved)="onEditSaved()" />
    }
  `,
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  editOpen = signal(false);
  loading = signal(false);
  names = '';
  lastName = '';
  document = '';
  phone = '';
  gender = 'M';
  username = '';
  email = '';
  roleName = '';
  signature = signal<string | null>(null);
  photo = signal<string | null>(null);
  initials = '';

  ngOnInit(): void {
    const info = this.auth.getUserInfo();
    if (info) {
      this.username = info.username;
      this.email = info.email;
      this.roleName = info.role || '';
      this.initials = (info.username?.[0] || 'U').toUpperCase();
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.auth.getProfile().subscribe({
      next: (res) => {
        this.names = res.names;
        this.lastName = res.last_name;
        this.document = res.document;
        this.phone = res.phone;
        this.gender = res.gender;
        this.signature.set(res.signature);
        this.photo.set(res.photo);
        this.initials = (res.names?.[0] || 'U').toUpperCase();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar perfil');
      },
    });
  }

  onEditSaved(): void {
    this.editOpen.set(false);
    this.loadProfile();
  }
}
