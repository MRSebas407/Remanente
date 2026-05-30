import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, UserInfo } from './auth.model';

interface LoginResponse {
  access: string;
  refresh: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login/`, data)
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.access);
          localStorage.setItem(this.REFRESH_KEY, res.refresh);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getUserInfo(): UserInfo | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  getUserRole(): string | null {
    return this.getUserInfo()?.role || null;
  }

  getUserName(): string | null {
    const info = this.getUserInfo();
    return info?.username || null;
  }

  getAdviserId(): number | null {
    return this.getUserInfo()?.adviser_id || null;
  }

  mustChangePassword(): boolean {
    return this.getUserInfo()?.must_change_password ?? false;
  }

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/profile/me/`);
  }

  updateProfile(data: FormData): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/profile/me/`, data);
  }

  changePassword(newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/profile/change_password/`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    }).pipe(
      tap(() => {
        const info = this.getUserInfo();
        if (info) {
          info.must_change_password = false;
          localStorage.setItem(this.USER_KEY, JSON.stringify(info));
        }
      })
    );
  }
}
