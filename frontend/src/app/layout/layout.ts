import { Component, inject, signal, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Toast } from '../shared/toast';
import { Confirm } from '../shared/confirm';
import { ICONS } from '../shared/icons';

interface MenuItem {
  path?: string;
  label: string;
  icon: string;
  exact: boolean;
  children?: MenuItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast, Confirm],
  template: `
    <div class="min-h-screen flex bg-secondary">
      <aside
        class="bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-200 ease-in-out hidden sm:flex"
        [class.w-16]="!sidebarHover" [class.w-56]="sidebarHover"
        (mouseenter)="sidebarHover = true" (mouseleave)="sidebarHover = false"
      >
        <div class="h-14 flex items-center border-b border-sidebar-border overflow-hidden px-3">
          @if (sidebarHover) {
            <span class="font-bold text-lg text-sidebar-text whitespace-nowrap">App Iglesia</span>
          } @else {
            <img src="logo.png" alt="AI" class="h-8 w-8 mx-auto" />
          }
        </div>
        <nav class="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
          @for (item of menuItems; track item.label) {
            @if (item.children) {
              <div>
                <div class="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-sidebar-text-secondary cursor-default"
                  [class.justify-center]="!sidebarHover"
                >
                  <span class="shrink-0 block w-6 h-5 text-center" [innerHTML]="svgIcon(item.icon)"></span>
                  <span class="transition-all duration-150 text-xs uppercase tracking-wide font-medium whitespace-nowrap"
                    [class.w-0]="!sidebarHover" [class.overflow-hidden]="!sidebarHover" [class.opacity-0]="!sidebarHover"
                    [class.w-auto]="sidebarHover" [class.opacity-100]="sidebarHover"
                  >{{ item.label }}</span>
                </div>
                <div class="space-y-0.5">
                  @for (child of item.children; track child.path) {
                    <a [routerLink]="child.path" routerLinkActive="bg-sidebar-active text-sidebar-text font-medium"
                      [routerLinkActiveOptions]="{exact: child.exact}"
                      class="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap text-sidebar-text-secondary hover:bg-sidebar-hover"
                      [class.justify-center]="!sidebarHover"
                    >
                      <span class="shrink-0 block w-6 h-4 text-center" [innerHTML]="svgIcon(child.icon)"></span>
                      <span class="transition-all duration-150 whitespace-nowrap"
                        [class.w-0]="!sidebarHover" [class.overflow-hidden]="!sidebarHover" [class.opacity-0]="!sidebarHover"
                        [class.w-auto]="sidebarHover" [class.opacity-100]="sidebarHover"
                      >{{ child.label }}</span>
                    </a>
                  }
                </div>
              </div>
            } @else {
              <a [routerLink]="item.path" routerLinkActive="bg-sidebar-active text-sidebar-text font-medium"
                [routerLinkActiveOptions]="{exact: item.exact}"
                class="flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors whitespace-nowrap text-sidebar-text-secondary hover:bg-sidebar-hover"
                [class.justify-center]="!sidebarHover"
              >
                <span class="shrink-0 block w-6 h-5 text-center" [innerHTML]="svgIcon(item.icon)"></span>
                <span class="transition-all duration-150 whitespace-nowrap"
                  [class.w-0]="!sidebarHover" [class.overflow-hidden]="!sidebarHover" [class.opacity-0]="!sidebarHover"
                  [class.w-auto]="sidebarHover" [class.opacity-100]="sidebarHover"
                >{{ item.label }}</span>
              </a>
            }
          }
        </nav>
      </aside>

      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-14 bg-navbar border-b border-sidebar-border px-4 sm:px-6 flex items-center justify-between gap-4">
          <button (click)="sidebarOpen.set(!sidebarOpen())" class="sm:hidden text-xl p-1 hover:bg-sidebar-hover rounded text-sidebar-text">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div class="flex-1"></div>
          <div class="relative">
            <button (click)="dropdownOpen.set(!dropdownOpen())" class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sidebar-hover transition-colors">
              <div class="w-7 h-7 rounded-full bg-sidebar-text text-navbar flex items-center justify-center text-xs font-bold shrink-0">
                {{ initials }}
              </div>
              <div class="text-left hidden sm:block">
                <p class="text-sm font-medium text-sidebar-text leading-tight">{{ userName }}</p>
                <p class="text-xs text-sidebar-text-secondary leading-tight">{{ userRole }}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sidebar-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            @if (dropdownOpen()) {
              <div class="absolute right-0 mt-2 w-56 bg-navbar border border-sidebar-border rounded-xl shadow-lg py-1 z-20">
                <button (click)="toggleTheme()" class="w-full flex items-center gap-3 px-4 py-2 text-sm text-sidebar-text hover:bg-sidebar-hover transition-colors">
                  <span class="w-5 h-5" [innerHTML]="svgIcon(currentTheme === 'dark' ? 'sun' : 'moon')"></span>
                  <span>{{ currentTheme === 'dark' ? 'Modo claro' : 'Modo oscuro' }}</span>
                </button>
                <hr class="border-sidebar-border my-1">
                <button (click)="viewProfile()" class="w-full text-left px-4 py-2 text-sm text-sidebar-text hover:bg-sidebar-hover transition-colors">Ver perfil</button>
                <hr class="border-sidebar-border my-1">
                <button (click)="logout()" class="w-full text-left px-4 py-2 text-sm text-sidebar-text hover:bg-sidebar-hover transition-colors">Cerrar sesión</button>
              </div>
            }
          </div>
        </header>

        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (sidebarOpen()) {
      <div class="fixed inset-0 z-30 sm:hidden" (click)="sidebarOpen.set(false)">
        <div class="absolute inset-0 bg-black/30"></div>
        <aside class="absolute left-0 top-0 bottom-0 w-56 bg-sidebar border-r border-sidebar-border flex flex-col">
          <div class="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
            <h1 class="font-bold text-lg text-sidebar-text">App Iglesia</h1>
            <button (click)="sidebarOpen.set(false)" class="text-xl p-1 hover:bg-sidebar-hover rounded text-sidebar-text">&times;</button>
          </div>
          <nav class="flex-1 p-3 space-y-1">
            @for (item of menuItems; track item.label) {
              @if (item.children) {
                <div>
                  <p class="text-xs uppercase tracking-wide text-sidebar-text-secondary font-medium px-3 py-1.5">{{ item.label }}</p>
                  @for (child of item.children; track child.path) {
                    <a [routerLink]="child.path" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-active text-sidebar-text font-medium"
                      [routerLinkActiveOptions]="{exact: child.exact}"
                      class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-text-secondary hover:bg-sidebar-hover"
                    >
                      <span class="w-6 h-5 text-center inline-block" [innerHTML]="svgIcon(child.icon)"></span>
                      <span>{{ child.label }}</span>
                    </a>
                  }
                </div>
              } @else {
                <a [routerLink]="item.path" (click)="sidebarOpen.set(false)" routerLinkActive="bg-sidebar-active text-sidebar-text font-medium"
                  [routerLinkActiveOptions]="{exact: item.exact}"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-sidebar-text-secondary hover:bg-sidebar-hover"
                >
                  <span class="w-6 h-5 text-center inline-block" [innerHTML]="svgIcon(item.icon)"></span>
                  <span>{{ item.label }}</span>
                </a>
                }
              }
          </nav>
        </aside>
      </div>
    }
    <app-toast />
    <app-confirm />
  `,
})
export class Layout implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  sidebarOpen = signal(false);
  dropdownOpen = signal(false);
  sidebarHover = false;
  currentTheme = 'light';

  userName = this.auth.getUserName() || 'Usuario';
  userRole = this.auth.getUserRole() || '';
  initials = (this.userName[0] || 'U').toUpperCase();

  menuItems: MenuItem[] = [];

  constructor() {
    this.buildMenu();
  }

  ngOnInit(): void {
    this.currentTheme = this.auth.getUserInfo()?.theme || 'light';
    this.applyTheme();
  }

  private iconCache = new Map<string, SafeHtml>();

  svgIcon(name: string): SafeHtml {
    const cached = this.iconCache.get(name);
    if (cached) return cached;
    const svg = ICONS[name as keyof typeof ICONS] || '';
    const safe = this.sanitizer.bypassSecurityTrustHtml(svg);
    this.iconCache.set(name, safe);
    return safe;
  }

  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    this.saveTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    document.body.style.backgroundColor =
      this.currentTheme === 'dark' ? '#0f0f1a' : '#f5f5f5';
  }

  private saveTheme(): void {
    const fd = new FormData();
    fd.append('theme', this.currentTheme);
    this.auth.updateProfile(fd).subscribe();
  }

  private buildMenu(): void {
    const items: MenuItem[] = [
      { path: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
      { path: '/persons', label: 'Personas', icon: 'persons', exact: false },
      { path: '/calls', label: 'Llamadas', icon: 'calls', exact: false },
    ];
    if (this.userRole === 'Administrador' || this.userRole === 'Maestro') {
      items.push({ path: '/baptisms', label: 'Bautizos', icon: 'baptism', exact: false });
    }
    if (this.userRole === 'Administrador') {
      items.push({
        label: 'Asesores', icon: 'user', exact: false,
        children: [
          { path: '/advisers', label: 'Listado', icon: 'menu', exact: false },
        ],
      });
    }
    this.menuItems = items;
  }

  viewProfile(): void {
    this.dropdownOpen.set(false);
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
