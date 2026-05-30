import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, Specialism } from '../advisers/adviser.model';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${environment.apiUrl}/roles/`);
  }

  getSpecialisms(): Observable<Specialism[]> {
    return this.http.get<Specialism[]>(`${environment.apiUrl}/specialisms/`);
  }

  createRole(data: Partial<Role>): Observable<Role> {
    return this.http.post<Role>(`${environment.apiUrl}/roles/`, { name: data.name, description: data.description || '' });
  }

  updateRole(id: number, data: Partial<Role>): Observable<Role> {
    return this.http.patch<Role>(`${environment.apiUrl}/roles/${id}/`, data);
  }

  deactivateRole(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/roles/${id}/deactivate/`, {});
  }

  activateRole(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/roles/${id}/activate/`, {});
  }

  createSpecialism(data: Partial<Specialism>): Observable<Specialism> {
    return this.http.post<Specialism>(`${environment.apiUrl}/specialisms/`, { name: data.name, description: data.description || '' });
  }

  updateSpecialism(id: number, data: Partial<Specialism>): Observable<Specialism> {
    return this.http.patch<Specialism>(`${environment.apiUrl}/specialisms/${id}/`, data);
  }

  deactivateSpecialism(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/specialisms/${id}/deactivate/`, {});
  }

  activateSpecialism(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/specialisms/${id}/activate/`, {});
  }
}
