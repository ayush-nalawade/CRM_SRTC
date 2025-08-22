const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/audit.model', () => ({
	insertAudit: jest.fn(),
	listAudits: jest.fn(),
}));

// Mock a simple route to verify middleware writes audit
jest.mock('../src/routes/leads.routes', () => {
	const express = require('express');
	const { verifyJWT } = require('../src/middleware/auth');
	const { requireRole } = require('../src/middleware/requireRole');
	const { audit } = require('../src/middleware/audit');
	const router = express.Router();
	router.post('/leads', verifyJWT, requireRole('admin', 'manager', 'sales'), audit('lead', 'create'), (req, res) => {
		return res.status(201).json({ success: true, lead: { id: 'lead_x' } });
	});
	module.exports = router;
});

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const auditModel = require('../src/models/audit.model');

describe('Audit API and middleware', () => {
	const adminToken = jwtUtil.signToken({ sub: 'u_admin', org: 'org_1', role: 'admin' });

	beforeEach(() => jest.clearAllMocks());

	test('GET /api/audit requires admin and returns list', async () => {
		auditModel.listAudits.mockResolvedValueOnce({ items: [{ action: 'create' }], pageState: null });
		const res = await request(app)
			.get('/api/audit?from=2020-01-01T00:00:00Z&to=2030-01-01T00:00:00Z')
			.set('Authorization', `Bearer ${adminToken}`);
		expect(res.status).toBe(200);
		expect(res.body.items.length).toBe(1);
	});

	test('Audit middleware writes on successful lead create', async () => {
		const token = jwtUtil.signToken({ sub: 'u_sales', org: 'org_1', role: 'sales' });
		const res = await request(app)
			.post('/api/leads')
			.set('Authorization', `Bearer ${token}`)
			.send({ first_name: 'A' });
		expect(res.status).toBe(201);
		expect(auditModel.insertAudit).toHaveBeenCalled();
	});
});
