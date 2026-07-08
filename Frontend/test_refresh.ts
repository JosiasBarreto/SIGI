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
    const refreshToken = loginResp.data.refresh_token;
    console.log('Got tokens:', !!token, !!refreshToken);
    
    // Testing refresh
    console.log('\nTesting refresh...');
    const refreshResp = await api.post('/v1/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    console.log('Refresh Resp Keys:', Object.keys(refreshResp.data));
    console.log('Got new Access Token:', !!refreshResp.data.access_token);

  } catch (err: any) {
    console.error('Fatal Error:', err.response?.status, err.response?.data || err.message);
  }
}

run();
