const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';

jest.mock('../src/models/users.model', () => ({
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('../src/utils/crypto', () => ({
  hashPassword: jest.fn(async (p) => `hashed:${p}`),
  comparePassword: jest.fn(async (p, h) => h === `hashed:${p}`),
}));

const app = require('../src/app');
const usersModel = require('../src/models/users.model');

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register creates a user and returns token', async () => {
    usersModel.getUserByEmail.mockResolvedValueOnce(null);
    usersModel.createUser.mockResolvedValueOnce({
      organization_id: 'org_1',
      id: 'user_1',
      email: 'new@example.com',
      role: 'admin',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ organization_id: 'org_1', email: 'new@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'new@example.com' });
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    usersModel.getUserByEmail.mockResolvedValueOnce({ id: 'user_existing' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ organization_id: 'org_1', email: 'dup@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login returns token on valid credentials', async () => {
    usersModel.getUserByEmail.mockResolvedValueOnce({
      organization_id: 'org_1', id: 'user_1', email: 'u@example.com', role: 'manager', password_hash: 'hashed:password123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ organization_id: 'org_1', email: 'u@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('POST /api/auth/login rejects invalid credentials', async () => {
    usersModel.getUserByEmail.mockResolvedValueOnce({
      organization_id: 'org_1', id: 'user_1', email: 'u@example.com', role: 'manager', password_hash: 'hashed:password123',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ organization_id: 'org_1', email: 'u@example.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});


