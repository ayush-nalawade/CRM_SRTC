const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/stages.model', () => ({
  createStage: jest.fn(),
  listStagesByOrg: jest.fn(),
  getStageById: jest.fn(),
  updateStage: jest.fn(),
  deleteStage: jest.fn(),
}));

jest.mock('../src/models/leads.model', () => ({
  getLeadById: jest.fn(),
  updateLead: jest.fn(),
}));

jest.mock('../src/models/leadJourney.model', () => ({
  insertJourneyEntry: jest.fn(),
  listJourneyByLead: jest.fn(),
}));

const app = require('../src/app');
const jwt = require('../src/utils/jwt');
const stagesModel = require('../src/models/stages.model');
const leadsModel = require('../src/models/leads.model');
const journeyModel = require('../src/models/leadJourney.model');

describe('Stages and Journey API', () => {
  const adminToken = jwt.signToken({ sub: 'u_admin', org: 'org_1', role: 'admin' });
  const salesToken = jwt.signToken({ sub: 'u_sales', org: 'org_1', role: 'sales' });

  beforeEach(() => jest.clearAllMocks());

  // Stages
  test('POST /api/stages creates a stage (admin)', async () => {
    stagesModel.createStage.mockResolvedValueOnce({ id: 's1', name: 'Q' });

    const res = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Q', description: 'Initial', order: 1, is_final: false });

    expect(res.status).toBe(201);
    expect(res.body.stage).toMatchObject({ id: 's1' });
  });

  test('GET /api/stages lists stages', async () => {
    stagesModel.listStagesByOrg.mockResolvedValueOnce([{ id: 's1', name: 'Q' }]);

    const res = await request(app)
      .get('/api/stages')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.stages.length).toBe(1);
  });

  test('PATCH /api/stages/:id updates a stage (admin)', async () => {
    stagesModel.updateStage.mockResolvedValueOnce({ id: 's1', name: 'Q+' });

    const res = await request(app)
      .patch('/api/stages/s1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Q+' });

    expect(res.status).toBe(200);
    expect(res.body.stage.name).toBe('Q+');
  });

  test('DELETE /api/stages/:id rejects when stage in use or final (admin)', async () => {
    stagesModel.deleteStage.mockRejectedValueOnce(new Error('Cannot delete stage that has leads assigned to it'));

    const res = await request(app)
      .delete('/api/stages/s1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  // Lead stage transition
  test('POST /api/leads/:id/transition moves a lead and records journey', async () => {
    leadsModel.getLeadById.mockResolvedValueOnce({ id: 'l1', organization_id: 'org_1', stage_id: 'old_stage' });
    stagesModel.getStageById.mockResolvedValueOnce({ id: 'new_stage', organization_id: 'org_1' });
    journeyModel.insertJourneyEntry.mockResolvedValueOnce(true);
    leadsModel.updateLead.mockResolvedValueOnce({ id: 'l1', stage_id: 'new_stage' });

    const res = await request(app)
      .post('/api/leads/l1/transition')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ to_stage_id: 'new_stage', notes: 'Progressing' });

    expect(res.status).toBe(200);
    expect(res.body.lead.stage_id).toBe('new_stage');
    expect(journeyModel.insertJourneyEntry).toHaveBeenCalled();
  });

  test('GET /api/leads/:id/journey returns history', async () => {
    journeyModel.listJourneyByLead.mockResolvedValueOnce([
      { from_stage_id: 's1', to_stage_id: 's2' },
    ]);

    const res = await request(app)
      .get('/api/leads/l1/journey')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.journey.length).toBe(1);
  });
});