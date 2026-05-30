import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BaptismRegister, BaptismPayload, PendingPerson, TeacherEntry,
  Attendant, Calendar, Mode, ClassEntry, PaginatedResponse,
} from './baptism.model';

@Injectable({ providedIn: 'root' })
export class BaptismService {
  private http = inject(HttpClient);

  list(params?: { name?: string; decision?: string; baptized?: string; page?: number; page_size?: number }): Observable<PaginatedResponse<BaptismRegister>> {
    const q = new URLSearchParams();
    if (params?.name) q.set('name', params.name);
    if (params?.decision) q.set('decision', params.decision);
    if (params?.baptized) q.set('baptized', params.baptized);
    if (params?.page) q.set('page', String(params.page));
    if (params?.page_size) q.set('page_size', String(params.page_size));
    return this.http.get<PaginatedResponse<BaptismRegister>>(`${environment.apiUrl}/baptisms/?${q}`);
  }

  get(id: number): Observable<BaptismRegister> {
    return this.http.get<BaptismRegister>(`${environment.apiUrl}/baptisms/${id}/`);
  }

  create(data: BaptismPayload): Observable<any> {
    const fd = new FormData();
    fd.append('person', String(data.person));
    fd.append('teacher', String(data.teacher));
    fd.append('age', String(data.age));
    if (data.attendant) fd.append('attendant', String(data.attendant));
    if (data.class_ref) fd.append('class_ref', String(data.class_ref));
    if (data.baptism_decision) fd.append('baptism_decision', data.baptism_decision);
    if (data.photo) fd.append('photo', data.photo);
    if (data.shirt_size) fd.append('shirt_size', data.shirt_size);
    if (data.time_in_church) fd.append('time_in_church', data.time_in_church);
    if (data.baptized) fd.append('baptized', 'true');
    else fd.append('baptized', 'false');
    if (data.details) fd.append('details', data.details);
    return this.http.post(`${environment.apiUrl}/baptisms/`, fd);
  }

  update(id: number, data: BaptismPayload): Observable<any> {
    const fd = new FormData();
    fd.append('person', String(data.person));
    fd.append('teacher', String(data.teacher));
    fd.append('age', String(data.age));
    if (data.attendant) fd.append('attendant', String(data.attendant));
    else fd.append('attendant', '');
    if (data.class_ref) fd.append('class_ref', String(data.class_ref));
    else fd.append('class_ref', '');
    if (data.baptism_decision) fd.append('baptism_decision', data.baptism_decision);
    if (data.photo) fd.append('photo', data.photo);
    if (data.shirt_size) fd.append('shirt_size', data.shirt_size);
    if (data.time_in_church) fd.append('time_in_church', data.time_in_church);
    if (data.baptized) fd.append('baptized', 'true');
    else fd.append('baptized', 'false');
    if (data.details) fd.append('details', data.details);
    return this.http.patch(`${environment.apiUrl}/baptisms/${id}/`, fd);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/baptisms/${id}/`);
  }

  getPendingPersons(): Observable<PendingPerson[]> {
    return this.http.get<PendingPerson[]>(`${environment.apiUrl}/baptisms/pending_persons/`);
  }

  getTeachers(): Observable<TeacherEntry[]> {
    return this.http.get<TeacherEntry[]>(`${environment.apiUrl}/baptisms/teachers/`);
  }

  getAttendants(personId?: number): Observable<Attendant[]> {
    const q = personId ? `?person=${personId}` : '';
    return this.http.get<Attendant[]>(`${environment.apiUrl}/attendants/${q}`);
  }

  createAttendant(data: { full_name: string; phone: string }): Observable<Attendant> {
    return this.http.post<Attendant>(`${environment.apiUrl}/attendants/`, data);
  }

  updateAttendant(id: number, data: { full_name: string; phone: string }): Observable<Attendant> {
    return this.http.patch<Attendant>(`${environment.apiUrl}/attendants/${id}/`, data);
  }

  deleteAttendant(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/attendants/${id}/`);
  }

  getCalendars(): Observable<Calendar[]> {
    return this.http.get<Calendar[]>(`${environment.apiUrl}/calendars/`);
  }

  createCalendar(data: { day: string; hour: string; description?: string }): Observable<Calendar> {
    return this.http.post<Calendar>(`${environment.apiUrl}/calendars/`, data);
  }

  updateCalendar(id: number, data: { day: string; hour: string; description?: string }): Observable<Calendar> {
    return this.http.patch<Calendar>(`${environment.apiUrl}/calendars/${id}/`, data);
  }

  deleteCalendar(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/calendars/${id}/`);
  }

  getModes(): Observable<Mode[]> {
    return this.http.get<Mode[]>(`${environment.apiUrl}/modes/`);
  }

  createMode(data: { name: string; description?: string }): Observable<Mode> {
    return this.http.post<Mode>(`${environment.apiUrl}/modes/`, data);
  }

  updateMode(id: number, data: { name: string; description?: string }): Observable<Mode> {
    return this.http.patch<Mode>(`${environment.apiUrl}/modes/${id}/`, data);
  }

  deleteMode(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/modes/${id}/`);
  }

  getClasses(filter?: { calendar?: number }): Observable<ClassEntry[]> {
    const q = new URLSearchParams();
    if (filter?.calendar) q.set('calendar', String(filter.calendar));
    const qs = q.toString();
    return this.http.get<ClassEntry[]>(`${environment.apiUrl}/classes/${qs ? '?' + qs : ''}`);
  }

  createClass(data: { calendar: number; professor: number; mode: number }): Observable<ClassEntry> {
    return this.http.post<ClassEntry>(`${environment.apiUrl}/classes/`, data);
  }

  updateClass(id: number, data: { calendar: number; professor: number; mode: number }): Observable<ClassEntry> {
    return this.http.patch<ClassEntry>(`${environment.apiUrl}/classes/${id}/`, data);
  }

  deleteClass(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/classes/${id}/`);
  }

  getAdviserList(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/advisers/`);
  }

  quickRegister(personId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/baptisms/quick_register/`, { person_id: personId });
  }
}
