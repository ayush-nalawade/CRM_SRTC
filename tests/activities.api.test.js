const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/activities.model', () => ({
	insertActivity: jest.fn(),
	listActivities: jest.fn(),
}));

const app = require('../src/app');
const jwtUtil = require('../src/utils/jwt');
const activitiesModel = require('../src/models/activities.model');

describe('Activities API', () => {
	const salesToken = jwtUtil.signToken({ sub: 'user_sales', org: 'org_1', role: 'sales' });

	beforeEach(() => jest.clearAllMocks());

	test('POST /api/leads/:id/activities creates an activity', async () => {
		activitiesModel.insertActivity.mockResolvedValueOnce({ id: 'a1', type: 'call', description: 'Intro call' });

		const res = await request(app)
			.post('/api/leads/lead_1/activities')
			.set('Authorization', `Bearer ${salesToken}`)
			.send({ type: 'call', description: 'Intro call', details: { duration: 10 } });

		expect(res.status).toBe(201);
		expect(res.body.activity).toMatchObject({ id: 'a1', type: 'call' });
	});

	test('GET /api/leads/:id/activities returns paged activities', async () => {
		activitiesModel.listActivities.mockResolvedValueOnce({ items: [{ id: 'a1' }], pageState: 'NEXT' });

		const res = await request(app)
			.get('/api/leads/lead_1/activities?limit=2')
			.set('Authorization', `Bearer ${salesToken}`);

		expect(res.status).toBe(200);
		expect(res.body.items.length).toBe(1);
		expect(res.body.pageState).toBe('NEXT');
	});

	test('POST /api/leads/:id/activities validates type enum', async () => {
		const res = await request(app)
			.post('/api/leads/lead_1/activities')
			.set('Authorization', `Bearer ${salesToken}`)
			.send({ type: 'unknown', description: 'Invalid type' });

		expect(res.status).toBe(400);
	});
});
