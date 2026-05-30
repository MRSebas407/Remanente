import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PersonListEntry, PersonDetail, Country, City, Neighborhood, ChurchService, PaginatedResponse } from './person.model';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private http = inject(HttpClient);

  list(params: { name?: string; document?: string; phone?: string; specialism?: string; assignment_state?: string; page?: number; page_size?: number } = {}): Observable<PaginatedResponse<PersonListEntry>> {
    const q = new URLSearchParams();
    if (params.name) q.set('name', params.name);
    if (params.document) q.set('document', params.document);
    if (params.phone) q.set('phone', params.phone);
    if (params.specialism) q.set('specialism', params.specialism);
    if (params.assignment_state) q.set('assignment_state', params.assignment_state);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));
    return this.http.get<PaginatedResponse<PersonListEntry>>(`${environment.apiUrl}/persons/?${q}`);
  }

  get(id: number): Observable<PersonDetail> {
    return this.http.get<PersonDetail>(`${environment.apiUrl}/persons/${id}/`);
  }

  create(data: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/persons/`, data);
  }

  update(id: number, data: FormData): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/persons/${id}/`, data);
  }

  assignSpiritualFather(id: number, adviserId: number, override = false): Observable<any> {
    return this.http.post(`${environment.apiUrl}/persons/${id}/assign_spiritual_father/`, { adviser_id: adviserId, override });
  }

  enrollFundamentals(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/persons/${id}/enroll_fundamentals/`, {});
  }

  markBaptized(id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/persons/${id}/mark_baptized/`, {});
  }

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${environment.apiUrl}/countries/`);
  }

  getCities(countryId?: number): Observable<City[]> {
    const q = countryId ? `?country=${countryId}` : '';
    return this.http.get<City[]>(`${environment.apiUrl}/cities/${q}`);
  }

  getNeighborhoods(cityId?: number): Observable<Neighborhood[]> {
    const q = cityId ? `?city=${cityId}` : '';
    return this.http.get<Neighborhood[]>(`${environment.apiUrl}/neighborhoods/${q}`);
  }

  getServices(): Observable<ChurchService[]> {
    return this.http.get<ChurchService[]>(`${environment.apiUrl}/services/`);
  }
}
