// Auth API
import { apiClient } from './client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from '../types/auth';

export const authApi = {
  // 登入
  login: (data: LoginRequest) => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  // 註冊
  register: (data: RegisterRequest) => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  // 刷新 token
  refresh: (data: RefreshTokenRequest) => {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh', data);
  },

  // 登出 (客戶端清除 token)
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },
};
