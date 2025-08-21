const request = require('supertest');
const app = require('../src/app');

describe('Health and Ping', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: 'ok' });
  });

  it('GET /api/v1/ping returns pong', async () => {
    const res = await request(app).get('/api/v1/ping');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'pong' });
  });
});


