const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/leads.model', () => ({
  insertLead: jest.fn(),
  getLeadById: jest.fn(),
  updateLead: jest.fn(),
  deleteLead: jest.fn(),
  listLeadsByOrg: jest.fn(),
}));

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const leadsModel = require('../src/models/leads.model');

describe('Leads API', () => {
  const adminToken = jwtUtil.signToken({ sub: 'user_admin', org: 'org_1', role: 'admin' });
  const managerToken = jwtUtil.signToken({ sub: 'user_manager', org: 'org_1', role: 'manager' });
  const salesToken = jwtUtil.signToken({ sub: 'user_sales', org: 'org_1', role: 'sales' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/leads creates a lead (sales allowed)', async () => {
    leadsModel.insertLead.mockResolvedValueOnce({ id: 'lead_1', organization_id: 'org_1', first_name: 'Jane' });

    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ first_name: 'Jane' });

    expect(res.status).toBe(201);
    expect(res.body.lead).toMatchObject({ id: 'lead_1' });
  });

  test('GET /api/leads lists leads with paging', async () => {
    leadsModel.listLeadsByOrg.mockResolvedValueOnce({ items: [{ id: 'lead_1' }], pageState: null });

    const res = await request(app)
      .get('/api/leads?limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  test('GET /api/leads/:id returns a lead', async () => {
    leadsModel.getLeadById.mockResolvedValueOnce({ id: 'lead_1', organization_id: 'org_1' });

    const res = await request(app)
      .get('/api/leads/lead_1')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.lead.id).toBe('lead_1');
  });

  test('PATCH /api/leads/:id updates a lead', async () => {
    leadsModel.updateLead.mockResolvedValueOnce({ id: 'lead_1', status: 'won' });

    const res = await request(app)
      .patch('/api/leads/lead_1')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ status: 'won' });

    expect(res.status).toBe(200);
    expect(res.body.lead.status).toBe('won');
  });

  test('DELETE /api/leads/:id forbidden for sales', async () => {
    const res = await request(app)
      .delete('/api/leads/lead_1')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
  });

  test('DELETE /api/leads/:id allowed for manager', async () => {
    leadsModel.deleteLead.mockResolvedValueOnce(true);

    const res = await request(app)
      .delete('/api/leads/lead_1')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(204);
  });
});


