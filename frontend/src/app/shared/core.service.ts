import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Country, City, Neighborhood, ChurchService } from '../persons/person.model';

@Injectable({ providedIn: 'root' })
export class CoreService {
  private http = inject(HttpClient);

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${environment.apiUrl}/countries/`);
  }

  createCountry(data: Partial<Country>): Observable<Country> {
    return this.http.post<Country>(`${environment.apiUrl}/countries/`, data);
  }

  updateCountry(id: number, data: Partial<Country>): Observable<Country> {
    return this.http.patch<Country>(`${environment.apiUrl}/countries/${id}/`, data);
  }

  deleteCountry(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/countries/${id}/`);
  }

  getCities(countryId?: number): Observable<City[]> {
    const q = countryId ? `?country=${countryId}` : '';
    return this.http.get<City[]>(`${environment.apiUrl}/cities/${q}`);
  }

  createCity(data: Partial<City>): Observable<City> {
    return this.http.post<City>(`${environment.apiUrl}/cities/`, data);
  }

  updateCity(id: number, data: Partial<City>): Observable<City> {
    return this.http.patch<City>(`${environment.apiUrl}/cities/${id}/`, data);
  }

  deleteCity(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/cities/${id}/`);
  }

  getNeighborhoods(cityId?: number): Observable<Neighborhood[]> {
    const q = cityId ? `?city=${cityId}` : '';
    return this.http.get<Neighborhood[]>(`${environment.apiUrl}/neighborhoods/${q}`);
  }

  createNeighborhood(data: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.http.post<Neighborhood>(`${environment.apiUrl}/neighborhoods/`, data);
  }

  updateNeighborhood(id: number, data: Partial<Neighborhood>): Observable<Neighborhood> {
    return this.http.patch<Neighborhood>(`${environment.apiUrl}/neighborhoods/${id}/`, data);
  }

  deleteNeighborhood(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/neighborhoods/${id}/`);
  }

  getServices(): Observable<ChurchService[]> {
    return this.http.get<ChurchService[]>(`${environment.apiUrl}/services/`);
  }

  createService(data: Partial<ChurchService>): Observable<ChurchService> {
    return this.http.post<ChurchService>(`${environment.apiUrl}/services/`, data);
  }

  updateService(id: number, data: Partial<ChurchService>): Observable<ChurchService> {
    return this.http.patch<ChurchService>(`${environment.apiUrl}/services/${id}/`, data);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/services/${id}/`);
  }
}
