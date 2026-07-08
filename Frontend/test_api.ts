import axios from 'axios';

const api = axios.create({
  baseURL: 'https://0ebd-197-159-166-222.ngrok-free.app/api',
  timeout: 10000,
});

async function run() {
  try {
    // 2. Authentication Test
    console.log('\nTesting Auth...');
    const loginResp = await api.post('/v1/auth/login', {
      email: 'admin@sigi.com',
      password: 'password'
    });
    console.log('Login Response:', Object.keys(loginResp.data));
    const token = loginResp.data.access_token;
    console.log('Got Access Token:', !!token);
    
    api.defaults.headers.Authorization = `Bearer ${token}`;
    
    // Test me
    console.log('\nTesting Me...');
    const meResp = await api.get('/v1/auth/me');
    console.log('Me:', meResp.data);

    // Endpoints
    const endpoints = [
      '/v1/users',
      '/v1/armazem/produtos',
      '/v1/armazem/ingredientes',
      '/v1/armazem/materiais',
      '/v1/pedidos/clientes',
      '/v1/armazem/fornecedores',
      '/v1/pedidos',
      '/v1/producao/ordens',
      '/v1/requisicoes',
      '/v1/armazem/movimentacoes',
      '/v1/logistica/entregas',
      '/v1/financeiro/caixas',
      '/v1/auditoria',
      '/v1/eventos',
      '/v1/turnos',
      '/v1/relatorios/dashboard'
    ];

    for (const ep of endpoints) {
      console.log(`\nTesting ${ep}...`);
      try {
        const resp = await api.get(ep);
        if (resp.data.items) {
           console.log(`Success: received ${resp.data.items.length} items. Fields in first item:`, 
             resp.data.items.length > 0 ? Object.keys(resp.data.items[0]) : 'None');
        } else if (resp.data.data) {
           console.log(`Success (wrapped): received fields -`, Object.keys(resp.data.data));
           if (Array.isArray(resp.data.data)) {
               console.log('Array data first item fields:', resp.data.data.length > 0 ? Object.keys(resp.data.data[0]) : 'None');
           }
        } else {
           console.log(`Success: raw data`, typeof resp.data);
           if (typeof resp.data === 'object') console.log(Object.keys(resp.data));
        }
      } catch (err: any) {
        console.error(`Error on ${ep}:`, err.response?.status, err.response?.data || err.message);
      }
    }
    
  } catch (err: any) {
    console.error('Fatal Error:', err.response?.status, err.response?.data || err.message);
  }
}

run();
