import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardData, AdviserStats } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getReport(period: string = 'monthly', startDate?: string, endDate?: string): Observable<DashboardData> {
    let params = new HttpParams().set('period', period);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<DashboardData>(`${environment.apiUrl}/dashboard/`, { params });
  }

  getMyStats(): Observable<AdviserStats> {
    return this.http.get<AdviserStats>(`${environment.apiUrl}/dashboard/my_stats/`);
  }
}
