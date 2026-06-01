export interface DashboardSummary {
  total_registered: number;
  new_people: number;
  other_church: number;
  effective: number;
  baptized: number;
}

export interface TrendEntry {
  date: string;
  total: number;
  new_people: number;
  other_church: number;
  effective: number;
  baptized: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  trend: TrendEntry[];
  period: string;
  start_date: string;
  end_date: string;
}

export interface AdviserStats {
  total_assigned: number;
  pending_calls: number;
  expired_calls: number;
  made_calls: number;
  effective_calls: number;
  not_effective_calls: number;
  baptized: number;
  pending_baptism?: number;
  registered_baptism?: number;
  baptized_baptism?: number;
}
