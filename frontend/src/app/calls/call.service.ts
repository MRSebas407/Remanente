import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CallEntry, PendingCall, CallDetail, PaginatedResponse } from './call.model';

@Injectable({ providedIn: 'root' })
export class CallService {
  private http = inject(HttpClient);

  getAllCalls(params?: { name?: string; made_by?: string; state?: string; page?: number; page_size?: number }): Observable<PaginatedResponse<CallEntry>> {
    const query = new URLSearchParams();
    if (params?.name) query.set('name', params.name);
    if (params?.made_by) query.set('made_by', params.made_by);
    if (params?.state) query.set('state', params.state);
    if (params?.page) query.set('page', String(params.page));
    if (params?.page_size) query.set('page_size', String(params.page_size));
    const qs = query.toString();
    return this.http.get<PaginatedResponse<CallEntry>>(`${environment.apiUrl}/calls/all_calls/${qs ? '?' + qs : ''}`);
  }

  getPendingCalls(): Observable<PendingCall[]> {
    return this.http.get<PendingCall[]>(`${environment.apiUrl}/calls/pending_calls/`);
  }

  getCallDetails(callId: number): Observable<CallDetail[]> {
    return this.http.get<CallDetail[]>(`${environment.apiUrl}/call-details/?call=${callId}`);
  }

  recordCall(callId: number, data: FormData): Observable<any> {
    return this.http.post(`${environment.apiUrl}/calls/${callId}/record_call/`, data);
  }

  createCall(data: { person: number; call_number: number; made_by: number; scheduled_date: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/calls/`, data);
  }

  updateCallDetail(detailId: number, data: any): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/call-details/${detailId}/`, data);
  }
}
