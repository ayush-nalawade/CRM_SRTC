const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/customFieldDefs.model', () => ({
  allowedTypes: ['text', 'number', 'date', 'dropdown', 'checkbox'],
  createDefinition: jest.fn(),
  listDefinitionsByEntity: jest.fn(),
  getDefinitionById: jest.fn(),
  updateDefinition: jest.fn(),
  deleteDefinition: jest.fn(),
}));

jest.mock('../src/models/customFieldValues.model', () => ({
  upsertValues: jest.fn(),
  listValues: jest.fn(),
}));

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const defsModel = require('../src/models/customFieldDefs.model');
const valuesModel = require('../src/models/customFieldValues.model');

describe('Custom Fields API', () => {
  const adminToken = require('../src/utils/jwt').signToken({ sub: 'u1', org: 'org_1', role: 'admin' });
  const salesToken = require('../src/utils/jwt').signToken({ sub: 'u2', org: 'org_1', role: 'sales' });

  beforeEach(() => jest.clearAllMocks());

  test('Admin creates a definition', async () => {
    defsModel.createDefinition.mockResolvedValueOnce({ id: 'def_1', name: 'Budget' });
    const res = await request(app)
      .post('/api/custom-fields')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ entity_type: 'lead', name: 'Budget', type: 'number' });
    expect(res.status).toBe(201);
  });

  test('Non-admin cannot create a definition', async () => {
    const res = await request(app)
      .post('/api/custom-fields')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ entity_type: 'lead', name: 'Budget', type: 'number' });
    expect(res.status).toBe(403);
  });

  test('List definitions', async () => {
    defsModel.listDefinitionsByEntity.mockResolvedValueOnce([{ id: 'def_1', name: 'Budget' }]);
    const res = await request(app)
      .get('/api/custom-fields?entity_type=lead')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.definitions.length).toBe(1);
  });

  test('Upsert lead values', async () => {
    valuesModel.upsertValues.mockResolvedValueOnce(true);
    const res = await request(app)
      .put('/api/leads/lead_1/custom-fields')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ 'def_1': 10000 });
    expect(res.status).toBe(204);
  });

  test('Get lead values', async () => {
    valuesModel.listValues.mockResolvedValueOnce({ def_1: 10000 });
    const res = await request(app)
      .get('/api/leads/lead_1/custom-fields')
      .set('Authorization', `Bearer ${salesToken}`);
    expect(res.status).toBe(200);
    expect(res.body.values.def_1).toBe(10000);
  });
});


