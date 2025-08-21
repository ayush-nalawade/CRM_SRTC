const { requireRole } = require('../src/middleware/requireRole');

function mockReq(role) {
  return { auth: role ? { role } : undefined };
}

function mockRes() {
  return {};
}

function runMiddleware(mw, req) {
  return new Promise((resolve) => {
    mw(req, mockRes(), (err) => resolve(err));
  });
}

describe('requireRole middleware', () => {
  test('allows when role is in allowed list', async () => {
    const mw = requireRole('admin', 'manager');
    const err = await runMiddleware(mw, mockReq('admin'));
    expect(err).toBeUndefined();
  });

  test('blocks when role is not in allowed list', async () => {
    const mw = requireRole('admin');
    const err = await runMiddleware(mw, mockReq('user'));
    expect(err).toBeDefined();
    expect(err.status || err.statusCode).toBe(403);
  });

  test('blocks when auth missing', async () => {
    const mw = requireRole('admin');
    const err = await runMiddleware(mw, mockReq(undefined));
    expect(err).toBeDefined();
    expect(err.status || err.statusCode).toBe(401);
  });
});


