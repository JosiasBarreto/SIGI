import apiClient from '../api/client';

export interface BackupItemDTO {
  id?: string | number;
  filename: string;
  size?: number | string;
  formatted_size?: string;
  created_at?: string;
  date?: string;
  type?: string;
}

export function formatBytes(bytes: number | string | undefined): string {
  if (!bytes && bytes !== 0) return '0 KB';
  if (typeof bytes === 'string' && (bytes.includes('KB') || bytes.includes('MB') || bytes.includes('GB') || bytes.includes('B'))) {
    return bytes;
  }
  const num = Number(bytes);
  if (isNaN(num) || num === 0) return '0 KB';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const backupService = {
  /**
   * GET /api/v1/backups — Lista todos os ficheiros com tamanho formatado (KB/MB) e data.
   */
  getAll: async (params?: { page?: number; per_page?: number }): Promise<any> => {
    try {
      const response: any = await apiClient.get('/v1/backups', { params });
      const rawList = Array.isArray(response)
        ? response
        : (response?.data?.items || response?.data?.backups || response?.backups || response?.data || response?.items || []);

      const mappedList: BackupItemDTO[] = Array.isArray(rawList)
        ? rawList.map((item: any) => {
            const rawSize = item.size ?? item.formatted_size;
            const displaySize = item.formatted_size || formatBytes(rawSize);
            const rawDate = item.created_at || item.date || item.created_date;
            const displayDate = rawDate ? new Date(rawDate).toLocaleString('pt-PT') : 'Sem data';

            return {
              id: item.id || item.filename,
              filename: item.filename || item.name || 'backup.sql',
              size: rawSize,
              formatted_size: displaySize,
              created_at: rawDate,
              date: displayDate,
              type: item.type || (item.filename?.includes('auto') ? 'Automático' : 'Manual')
            };
          })
        : [];

      const serverTotal = response?.total ?? response?.data?.total;
      const serverPages = response?.pages ?? response?.data?.pages;

      if (params?.page || params?.per_page) {
        const page = Number(params?.page || 1);
        const perPage = Number(params?.per_page || 10);
        const total = serverTotal !== undefined ? Number(serverTotal) : mappedList.length;
        const pages = serverPages !== undefined ? Number(serverPages) : Math.max(1, Math.ceil(total / perPage));
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const items = (serverTotal !== undefined && serverPages !== undefined && mappedList.length <= perPage)
          ? mappedList
          : (mappedList.length > perPage ? mappedList.slice(startIndex, endIndex) : mappedList);

        const result: any = [...items];
        result.items = items;
        result.total = total;
        result.pages = pages;
        result.page = page;
        return result;
      }

      const result: any = [...mappedList];
      result.items = mappedList;
      result.total = mappedList.length;
      result.pages = 1;
      result.page = 1;
      return result;
    } catch (error) {
      console.error('[backupService] Erro ao carregar backups do backend:', error);
      throw error;
    }
  },

  /**
   * Alias de paginação para backups
   */
  getBackups: async (params?: { page?: number; per_page?: number }): Promise<any> => {
    return backupService.getAll(params);
  },

  /**
   * POST /api/v1/backups — Cria um novo snapshot .sql.
   */
  create: async (): Promise<BackupItemDTO> => {
    const response: any = await apiClient.post('/v1/backups', {});
    const item = response?.data || response;
    const rawSize = item.size ?? item.formatted_size;
    const displaySize = item.formatted_size || formatBytes(rawSize);
    const rawDate = item.created_at || item.date || new Date().toISOString();
    const displayDate = new Date(rawDate).toLocaleString('pt-PT');

    return {
      id: item.id || item.filename,
      filename: item.filename || item.name || `backup_${Date.now()}.sql`,
      size: rawSize,
      formatted_size: displaySize,
      created_at: rawDate,
      date: displayDate,
      type: item.type || 'Manual'
    };
  },

  /**
   * GET /api/v1/backups/<filename>/download — Descarrega o .sql para o computador.
   */
  download: async (filename: string): Promise<void> => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    const encodedName = encodeURIComponent(filename);
    const downloadUrl = `${apiClient.defaults.baseURL}/v1/backups/${encodedName}/download`;

    try {
      // Tentar descarregar como Blob para incluir o cabeçalho Authorization se necessário
      const response = await fetch(downloadUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('[backupService] Falha no download via blob, tentando abertura direta:', e);
    }

    // Fallback: Abertura direta do link no navegador
    window.open(downloadUrl, '_blank');
  },

  /**
   * POST /api/v1/backups/<filename>/restore — Restaura a base de dados a partir de um snapshot existente no servidor.
   */
  restoreServerFile: async (filename: string): Promise<any> => {
    const encodedName = encodeURIComponent(filename);
    return apiClient.post(`/v1/backups/${encodedName}/restore`, {}, { timeout: 600000 });
  },

  /**
   * POST /api/v1/backups/restore — Restaura a base de dados através do envio/upload de um ficheiro .sql.
   */
  restoreUpload: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post('/v1/backups/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 600000
    });
  },

  /**
   * DELETE /api/v1/backups/<filename> — Elimina cópias de segurança antigas.
   */
  delete: async (filename: string): Promise<any> => {
    const encodedName = encodeURIComponent(filename);
    return apiClient.delete(`/v1/backups/${encodedName}`);
  }
};
