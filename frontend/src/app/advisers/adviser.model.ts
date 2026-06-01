export interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Specialism {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface AdviserPayload {
  username: string;
  email: string;
  password: string;
  names: string;
  last_name: string;
  document: string;
  phone: string;
  gender: string;
  role_ids: number[];
  specialism_id?: number | null;
  photo?: File | null;
  signature?: File | null;
}

export interface AdviserListEntry {
  id: number;
  full_name: string;
  roles: Role[];
  document: string;
  phone: string;
  is_active: boolean;
  assigned_count: number;
  signature: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdviserDetail {
  id: number;
  profile: {
    id: number;
    names: string;
    last_name: string;
    document: string;
    phone: string;
    photo: string | null;
    gender: string;
  };
  roles: Role[];
  specialism: Specialism | null;
  signature: string | null;
  is_active: boolean;
  assigned_count: number;
}
