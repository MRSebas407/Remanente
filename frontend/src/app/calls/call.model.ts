export interface CallEntry {
  detail_id: number;
  call_id: number;
  person_id: number;
  person_name: string;
  call_number: number;
  scheduled_date: string;
  date_made: string | null;
  made: boolean;
  state: string | null;
  annotation: string;
  signature: string | null;
  made_by_id: number;
  made_by_name: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface PendingCall {
  detail_id: number;
  call_id: number;
  person_id: number;
  person_name: string;
  call_number: number;
  scheduled_date: string;
  remaining_hours: number;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface CallDetail {
  id: number;
  call: number;
  made_by: number;
  scheduled_date: string;
  date_made: string | null;
  made: boolean;
  state: string | null;
  annotation: string;
  signature: string | null;
}

export interface Call {
  id: number;
  person: number;
  call_number: number;
  created_in: string;
  details: CallDetail[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
