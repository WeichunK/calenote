// Authentication Types - 與後端 API schema 對應

export interface UserSummary {
  id: string;
  username: string;
  email: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}
