import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error_code?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  pages: number;
  page: number;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    // Return standard responses directly, or map if needed
    // The previous implementation mapped success response. Let's just return response.data
    // but ensure it aligns with callers expecting .data to be the payload if not using ApiResponse wrapper
    return response.data;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If unauthorized (401) and we haven't already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Attempt to refresh token using Authentication bearer header
          const refreshResponse = await axios.post(`${apiClient.defaults.baseURL}/v1/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
          });
          
          if (refreshResponse.data && refreshResponse.data.access_token) {
            const newAccessToken = refreshResponse.data.access_token;
            localStorage.setItem('access_token', newAccessToken);
            
            // Set for all future requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            
            // Set for the original skipped request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Session expired or renewal failed:', refreshError);
        // Refresh token failed or expired, clear storage and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    let standardError = error.response?.data || {
      success: false,
      message: error.message || 'Network error occurred',
      error_code: error.response?.status?.toString() || 'NETWORK_ERROR',
    };

    if (error.response?.status) {
      const status = error.response.status;
      const dataDetail = error.response.data?.detail || error.response.data?.message;

      switch (status) {
        case 400:
          standardError.message = dataDetail || 'Erro de Negócio: O pedido é inválido ou contém dados incorretos.';
          standardError.error_code = 'BUSINESS_ERROR_400';
          break;
        case 403:
          standardError.message = dataDetail || 'Acesso Negado: Não tem permissões para realizar esta ação.';
          standardError.error_code = 'FORBIDDEN_403';
          break;
        case 409:
          standardError.message = dataDetail || 'Conflito Financeiro: O estado do pagamento ou venda não permite esta ação.';
          standardError.error_code = 'CONFLICT_409';
          break;
        case 422:
          standardError.message = dataDetail || 'Erro de Validação: Verifique os dados introduzidos.';
          standardError.error_code = 'VALIDATION_ERROR_422';
          break;
        case 500:
          standardError.message = dataDetail || 'Erro do Servidor: Ocorreu um problema no servidor. Tente novamente mais tarde.';
          standardError.error_code = 'SERVER_ERROR_500';
          break;
      }
    }

    return Promise.reject(standardError);
  }
);

export default apiClient;
