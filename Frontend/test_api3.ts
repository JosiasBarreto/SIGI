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
    
    // Testing specific actions
    const endpoints = [
      '/v1/eventos',
      '/v1/turnos',
      '/v1/relatorios/dashboard',
      '/v1/armazem/movimentacoes',
      '/v1/financeiro/caixas',
    ];

    for (const ep of endpoints) {
      console.log(`\nTesting ${ep}...`);
      try {
        const resp = await api.get(ep);
        if (resp.data.items) {
            console.log(`Items list of length`, resp.data.items.length);
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
