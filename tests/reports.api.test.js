const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/reporting.model', () => ({
  countLeadsByStagePartition: jest.fn(),
  listOwnerIdsFromLeads: jest.fn(),
  countLeadsByOwnerPartition: jest.fn(),
  listJourneysByDayRange: jest.fn(),
}));

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const rptModel = require('../src/models/reporting.model');

describe('Reports API', () => {
  const managerToken = jwtUtil.signToken({ sub: 'u_mgr', org: 'org_1', role: 'manager' });

  beforeEach(() => jest.clearAllMocks());

  test('GET /api/reports/leads-by-stage returns counts per stage', async () => {
    rptModel.countLeadsByStagePartition
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);

    const res = await request(app)
      .get('/api/reports/leads-by-stage?stage_ids=s1,s2')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([
      { stage_id: 's1', count: 5 },
      { stage_id: 's2', count: 2 },
    ]);
  });

  test('GET /api/reports/leads-by-owner returns sorted counts', async () => {
    rptModel.listOwnerIdsFromLeads.mockResolvedValueOnce(['o1', 'o2']);
    rptModel.countLeadsByOwnerPartition
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(7);

    const res = await request(app)
      .get('/api/reports/leads-by-owner')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items[0]).toEqual({ owner_id: 'o2', count: 7 });
    expect(res.body.items[1]).toEqual({ owner_id: 'o1', count: 3 });
  });

  test('GET /api/reports/funnel aggregates transitions per stage', async () => {
    rptModel.listJourneysByDayRange.mockResolvedValueOnce([
      { to_stage_id: 's1' },
      { to_stage_id: 's1' },
      { to_stage_id: 's2' },
    ]);

    const res = await request(app)
      .get('/api/reports/funnel?from=2025-01-01&to=2025-01-31')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    // s1 should have 2, s2 should have 1
    expect(res.body.items.find(i => i.stage_id === 's1').count).toBe(2);
    expect(res.body.items.find(i => i.stage_id === 's2').count).toBe(1);
  });
});
