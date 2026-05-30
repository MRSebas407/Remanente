export interface PersonListEntry {
  id: number;
  names: string;
  lastname: string;
  document: string;
  phone: string;
  gender: string;
  assignment_state: string;
  member_state: string;
  specialism: string;
  register_date: string;
  spiritual_father: number | null;
  spiritual_father_name: string | null;
  registered_by: number;
  registered_by_name: string;
  enrollment_fund_1: boolean;
  baptized: boolean;
  has_baptism: boolean;
  photo: string | null;
  data_consent: boolean;
}

export interface PersonDetail {
  id: number;
  names: string;
  lastname: string;
  document: string;
  phone: string;
  gender: string;
  address: string;
  specialism: string;
  comes_from_church: string | null;
  comes_from_details: string | null;
  country: number;
  country_name: string | null;
  city: number;
  city_name: string | null;
  neighborhood: number;
  neighborhood_name: string | null;
  church_service: number;
  church_service_name: string | null;
  spiritual_father: number | null;
  spiritual_father_name: string | null;
  registered_by: number;
  registered_by_name: string | null;
  signature: string | null;
  photo: string | null;
  assignment_state: string;
  member_state: string;
  register_date: string;
  enrollment_fund_1: boolean;
  baptized: boolean;
  data_consent: boolean;
}

export interface Country {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  country: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  city: number;
}

export interface ChurchService {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
