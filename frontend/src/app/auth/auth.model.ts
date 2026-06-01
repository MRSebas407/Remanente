export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string | null;
  adviser_id: number | null;
  must_change_password: boolean;
  theme: string;
  photo?: string | null;
  names?: string | null;
  last_name?: string | null;
}
