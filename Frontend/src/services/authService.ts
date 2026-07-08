import apiClient from '../api/client';

export const authService = {
  async login(credentials: { email?: string; password?: string; pin?: string }): Promise<any> {
    const response = await apiClient.post('/v1/auth/login', credentials);
    const { access_token, refresh_token, user } = response as any;
    
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },

  async logout(): Promise<any> {
    try {
      await apiClient.post<any>('/v1/auth/logout');
    } catch(e) {}
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return { success: true };
  },

  async getProfile(): Promise<any> {
    const userStr = localStorage.getItem('user');
    if (userStr) return { data: JSON.parse(userStr) };
    return null;
  },

  async changePassword(data: any): Promise<any> {
    return apiClient.post<any>('/v1/auth/change-password', data);
  },

  async recoverPassword(email: string): Promise<any> {
    return apiClient.post<any>('/v1/auth/recover-password', { email });
  }
};

