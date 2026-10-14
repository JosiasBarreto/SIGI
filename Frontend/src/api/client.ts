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

/**
 * Extrai a mensagem de texto ou "sms" enviada pelo backend a partir de qualquer estrutura
 * (incluindo { sms: "..." }, { mensagem: "..." }, { msg: "..." }, { detail: "..." }, { error: "..." }, etc.)
 */
export function extractBackendErrorMessage(errOrData: any): string {
  if (!errOrData) return '';
  if (typeof errOrData === 'string') return errOrData;

  const data = errOrData.response?.data !== undefined ? errOrData.response.data : errOrData;
  if (!data) {
    if (typeof errOrData.message === 'string' && errOrData.message !== '[object Object]') {
      return errOrData.message;
    }
    return '';
  }
  if (typeof data === 'string') return data;

  // 1. Procurar propriedades comuns de mensagem, incluindo "sms" do backend
  const candidate =
    data.sms ||
    data.mensagem ||
    data.msg ||
    data.message ||
    data.detail ||
    data.detalhe ||
    data.error ||
    data.erro ||
    data.descricao ||
    data.motivo ||
    data.reason ||
    data.title ||
    data.details?.exception ||
    data.details?.message ||
    data.details?.msg ||
    data.details?.sms;

  if (candidate) {
    if (typeof candidate === 'string') return candidate;
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item?.msg) return item.msg;
          if (item?.message) return item.message;
          if (item?.detail) return item.detail;
          if (item?.sms) return item.sms;
          return JSON.stringify(item);
        })
        .join('; ');
    }
    if (typeof candidate === 'object') {
      return (
        candidate.sms ||
        candidate.message ||
        candidate.msg ||
        candidate.detail ||
        candidate.error ||
        JSON.stringify(candidate)
      );
    }
  }

  // 2. Verificar array ou objeto de erros múltiplos
  if (data.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors
        .map((e: any) =>
          typeof e === 'string'
            ? e
            : e?.msg || e?.message || e?.sms || JSON.stringify(e)
        )
        .join('; ');
    }
    if (typeof data.errors === 'object') {
      const vals = Object.values(data.errors);
      return vals
        .map((v: any) => (Array.isArray(v) ? v.join(', ') : String(v)))
        .join('; ');
    }
  }

  // 3. Fallback para errOrData.message
  if (typeof errOrData.message === 'string' && errOrData.message !== '[object Object]') {
    return errOrData.message;
  }

  return '';
}

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.88.236:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
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

    const rawData = error.response?.data;
    const backendMsg = extractBackendErrorMessage(rawData);

    let standardError: any = rawData
      ? (typeof rawData === 'object' ? { ...rawData } : { message: String(rawData) })
      : {
          success: false,
          message: error.message || 'Network error occurred',
          error_code: error.response?.status?.toString() || 'NETWORK_ERROR',
        };

    // Always preserve status and response object for error handlers
    standardError.status = error.response?.status;
    standardError.statusCode = error.response?.status;
    standardError.response = error.response;

    // Se o backend forneceu uma mensagem específica (sms, msg, detail, etc.), usar essa mensagem
    if (backendMsg) {
      standardError.message = backendMsg;
      standardError.sms = backendMsg;
    }

    if (error.response?.status) {
      const status = error.response.status;

      switch (status) {
        case 400:
          standardError.message = backendMsg || 'Erro de Negócio: O pedido é inválido ou contém dados incorretos.';
          standardError.error_code = 'BUSINESS_ERROR_400';
          break;
        case 401:
          standardError.message = backendMsg || 'Não autenticado: Sessão inválida ou expirada.';
          standardError.error_code = 'UNAUTHORIZED_401';
          break;
        case 403:
          standardError.message = backendMsg || 'Acesso Negado: Não tem permissões para realizar esta ação.';
          standardError.error_code = 'FORBIDDEN_403';
          break;
        case 404:
          standardError.message = backendMsg || 'Registo não encontrado no sistema.';
          standardError.error_code = 'NOT_FOUND_404';
          break;
        case 409:
          standardError.message = backendMsg || 'Conflito Operacional: O estado atual não permite esta ação.';
          standardError.error_code = 'CONFLICT_409';
          break;
        case 422:
          standardError.message = backendMsg || 'Erro de Validação: Verifique os dados introduzidos.';
          standardError.error_code = 'VALIDATION_ERROR_422';
          break;
        case 500:
          // Se o backend enviou mensagem ("sms", "detail", "msg", etc.), mostra essa mensagem real!
          standardError.message = backendMsg || rawData?.details?.exception || 'Erro do Servidor: Ocorreu um problema no servidor.';
          standardError.error_code = 'SERVER_ERROR_500';
          break;
        default:
          if (backendMsg) {
            standardError.message = backendMsg;
          }
          break;
      }
    }

    return Promise.reject(standardError);
  }
);

export default apiClient;
