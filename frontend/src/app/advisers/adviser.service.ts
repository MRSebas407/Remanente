import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, Specialism, AdviserPayload, AdviserListEntry, PaginatedResponse, AdviserDetail } from './adviser.model';

@Injectable({ providedIn: 'root' })
export class AdviserService {
  private http = inject(HttpClient);

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/roles/`);
  }

  getSpecialisms(): Observable<Specialism[]> {
    return this.http.get<Specialism[]>(`${environment.apiUrl}/specialisms/`);
  }

  create(payload: AdviserPayload): Observable<any> {
    const fd = new FormData();
    fd.append('username', payload.username);
    fd.append('email', payload.email);
    fd.append('password', payload.password);
    fd.append('names', payload.names);
    fd.append('last_name', payload.last_name);
    fd.append('document', payload.document);
    fd.append('phone', payload.phone);
    fd.append('gender', payload.gender);
    fd.append('role_id', String(payload.role_id));
    if (payload.specialism_id != null) {
      fd.append('specialism_id', String(payload.specialism_id));
    }
    if (payload.photo) fd.append('photo', payload.photo);
    if (payload.signature) fd.append('signature', payload.signature);
    return this.http.post(`${environment.apiUrl}/advisers/`, fd);
  }

  list(params: { search?: string; name?: string; document?: string; phone?: string; role_name?: string; is_active?: string; page?: number; page_size?: number } = {}): Observable<PaginatedResponse<AdviserListEntry>> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.name) query.set('name', params.name);
    if (params.document) query.set('document', params.document);
    if (params.phone) query.set('phone', params.phone);
    if (params.role_name) query.set('role_name', params.role_name);
    if (params.is_active) query.set('is_active', params.is_active);
    if (params.page) query.set('page', String(params.page));
    if (params.page_size) query.set('page_size', String(params.page_size));
    return this.http.get<PaginatedResponse<AdviserListEntry>>(`${environment.apiUrl}/advisers/?${query}`);
  }

  get(id: number): Observable<AdviserDetail> {
    return this.http.get<AdviserDetail>(`${environment.apiUrl}/advisers/${id}/`);
  }

  update(id: number, data: FormData): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/advisers/${id}/`, data);
  }

  deactivate(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/advisers/${id}/deactivate/`, {});
  }

  activate(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/advisers/${id}/activate/`, {});
  }

  resetPassword(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/advisers/${id}/reset_password/`, {});
  }
}
