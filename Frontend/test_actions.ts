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
    
    // Testing order status update
    console.log('\nFetching orders...');
    const ordersResp = await api.get('/v1/pedidos');
    const orders = ordersResp.data.items;
    console.log(`Got ${orders.length} orders.`);
    
    if (orders.length > 0) {
      const order = orders[0];
      console.log(`Updating order ${order.id} status...`);
      try {
          const updateResp = await api.put(`/v1/pedidos/${order.id}/estado`, {
              estado: 'Agendado',
              justificativa_cancelamento: ''
          });
          console.log('Update success!', Object.keys(updateResp.data));
      } catch (err: any) {
          console.error(`Update Error:`, err.response?.status, err.response?.data || err.message);
      }
    }

    // Testing Socket.IO
    // No socket.io test from node easily without adding socket.io-client. Actually, I can add it since I can use npx or we can just rely on the frontend.
    
  } catch (err: any) {
    console.error('Fatal Error:', err.message);
  }
}

run();
