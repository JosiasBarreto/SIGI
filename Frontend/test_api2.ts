import axios from 'axios';

const api = axios.create({
  baseURL: 'https://0ebd-197-159-166-222.ngrok-free.app/api',
  timeout: 10000,
});

async function run() {
  try {
    const loginResp = await api.post('/v1/auth/login', {
      email: 'admin@sigi.com',
      password: 'password'
    });
    const token = loginResp.data.access_token;
    api.defaults.headers.Authorization = `Bearer ${token}`;
    
    const endpoints = [
      '/v1/users',
      '/v1/pedidos/clientes',
      '/v1/armazem/produtos',
      '/v1/armazem/ingredientes',
      '/v1/armazem/materiais',
      '/v1/armazem/fornecedores',
      '/v1/pedidos',
      '/v1/producao/ordens',
      '/v1/requisicoes',
      '/v1/armazem/movimentacoes',
      '/v1/logistica/entregas',
      '/v1/financeiro/caixas',
      '/v1/auditoria',
      '/v1/configuracoes'
    ];

    for (const ep of endpoints) {
      console.log(`\nTesting ${ep}...`);
      try {
        const resp = await api.get(ep);
        console.log(`Success ${ep}. Fields: `, Object.keys(resp.data));
        if (resp.data.data && Array.isArray(resp.data.data)) {
           console.log(`Array length:`, resp.data.data.length);
           if (resp.data.data.length > 0) console.log(`First item keys:`, Object.keys(resp.data.data[0]));
        } else if (resp.data.items) {
           console.log(`Items length:`, resp.data.items.length);
           if (resp.data.items.length > 0) console.log(`First item keys:`, Object.keys(resp.data.items[0]));
        } else {
           console.log(resp.data);
        }
      } catch (err: any) {
        console.error(`Error on ${ep}:`, err.response?.status, err.response?.data || err.message);
      }
    }
  } catch (err: any) {
    console.error('Fatal Error:', err.message);
  }
}

run();
