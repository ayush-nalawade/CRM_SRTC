const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/audit.model', () => ({
	insertAudit: jest.fn(),
	listAudits: jest.fn(),
}));

jest.mock('../src/models/leads.model', () => ({
	getLeadById: jest.fn(),
	updateLead: jest.fn(),
}));

jest.mock('../src/models/stages.model', () => ({
	getStageById: jest.fn(),
}));

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const auditModel = require('../src/models/audit.model');
const leadsModel = require('../src/models/leads.model');
const stagesModel = require('../src/models/stages.model');

describe('Audit API and middleware', () => {
	const adminToken = jwtUtil.signToken({ sub: 'u_admin', org: 'org_1', role: 'admin' });
	const salesToken = jwtUtil.signToken({ sub: 'u_sales', org: 'org_1', role: 'sales' });

	beforeEach(() => jest.clearAllMocks());

	test('GET /api/audit requires admin and returns list', async () => {
		auditModel.listAudits.mockResolvedValueOnce({ items: [{ action: 'create' }], pageState: null });
		const res = await request(app)
			.get('/api/audit?from=2020-01-01T00:00:00Z&to=2030-01-01T00:00:00Z')
			.set('Authorization', `Bearer ${adminToken}`);
		expect(res.status).toBe(200);
		expect(res.body.items.length).toBe(1);
	});

	test('Audit middleware writes on stage transition', async () => {
		leadsModel.getLeadById.mockResolvedValueOnce({ id: 'l1', organization_id: 'org_1', stage_id: 'old' });
		stagesModel.getStageById.mockResolvedValueOnce({ id: 'new', organization_id: 'org_1' });
		leadsModel.updateLead.mockResolvedValueOnce({ id: 'l1', stage_id: 'new' });
		const res = await request(app)
			.post('/api/leads/l1/transition')
			.set('Authorization', `Bearer ${salesToken}`)
			.send({ to_stage_id: 'new' });
		expect(res.status).toBe(200);
		expect(auditModel.insertAudit).toHaveBeenCalled();
	});
});
