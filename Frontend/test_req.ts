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
    
    console.log('\nFetching requisitions...');
    const reqsResp = await api.get('/v1/requisicoes');
    const requisitions = reqsResp.data.items;
    
    if (requisitions.length > 0) {
      const id = requisitions[0].id;
      console.log(`Approving requisition ${id}...`);
      try {
          const updateResp = await api.put(`/v1/requisicoes/${id}/aprovar`, {
              itens: [] // just empty array to see if it works or gives 422
          });
          console.log('Update success!', Object.keys(updateResp.data));
      } catch (err: any) {
          console.error(`Update Error:`, err.response?.status, err.response?.data || err.message);
      }
    }
  } catch (err: any) {
    console.error('Fatal Error:', err.message);
  }
}

run();
