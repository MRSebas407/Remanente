export interface BaptismRegister {
  id: number;
  person: number;
  person_name: string;
  teacher: number;
  teacher_name: string;
  age: number | null;
  attendant: number | null;
  attendant_name: string | null;
  class_ref: number | null;
  class_info: { id: number; calendar: string; mode: string } | null;
  baptism_decision: string;
  photo: string | null;
  shirt_size: string;
  time_in_church: string;
  baptized: boolean;
  details: string;
  registration_date: string;
}

export interface BaptismPayload {
  person: number;
  teacher: number;
  age: number;
  attendant?: number | null;
  class_ref?: number | null;
  baptism_decision?: string;
  photo?: File | null;
  shirt_size?: string;
  time_in_church?: string;
  baptized?: boolean;
  details?: string;
}

export interface PendingPerson {
  person_id: number;
  person_name: string;
  document: string;
  phone: string;
}

export interface TeacherEntry {
  id: number;
  full_name: string;
  registration_count: number;
}

export interface Attendant {
  id: number;
  full_name: string;
  phone: string;
  person?: number;
}

export interface Calendar {
  id: number;
  day: string;
  hour: string;
  description: string;
}

export interface Mode {
  id: number;
  name: string;
  description: string;
}

export interface ClassEntry {
  id: number;
  calendar: number;
  professor: number;
  mode: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
