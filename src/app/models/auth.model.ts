export interface Role {
  id: number;
  name: string;
  hierarchy_level: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  tenant_id: number | null;
  name: string;
  username: string;
  email: string;
  phone: string;
  role_id: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}