// API Client - 支持 Web 和 Mobile
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Token management functions - will be overridden by specific implementations
let getAccessTokenFn = (): string | null => null;
let getRefreshTokenFn = (): string | null => null;
let updateTokensFn = (access: string, refresh: string): void => {};
let handleLogoutFn = (): void => {};

// Allow injection of token management functions
export function setTokenManagement(config: {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  updateTokens: (access: string, refresh: string) => void;
  handleLogout: () => void;
}) {
  getAccessTokenFn = config.getAccessToken;
  getRefreshTokenFn = config.getRefreshToken;
  updateTokensFn = config.updateTokens;
  handleLogoutFn = config.handleLogout;
}

export class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - 添加 auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = getAccessTokenFn();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - 處理錯誤和 token 刷新
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Log detailed error information for debugging
        if (error.response?.status === 422) {
          console.error('[API Client] 422 Validation Error:', {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
            response: error.response?.data,
          });
        }

        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 處理 401 - token 過期
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Redirect to login
            handleLogoutFn();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string | null> {
    // 防止多個同時的 refresh 請求
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      const refreshToken = getRefreshTokenFn();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;

      // Update tokens using injected function
      updateTokensFn(access_token, newRefreshToken || refreshToken);

      return access_token;
    })();

    try {
      return await this.tokenRefreshPromise;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  // Public API methods
  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    console.log('[API Client] POST request:', { url, data });
    const response = await this.client.post<T>(url, data);
    console.log('[API Client] POST response:', response.data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    console.log('[API Client] PATCH request:', { url, data });
    const response = await this.client.patch<T>(url, data);
    console.log('[API Client] PATCH response:', response.data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    console.log('[API Client] DELETE request:', { url });
    const response = await this.client.delete<T>(url);
    console.log('[API Client] DELETE response:', {
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }
}

// Factory function
export const createApiClient = (baseURL: string) => new ApiClient(baseURL);

// Default instance for web (base URL will be set via env)
export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
);
