const verifyToken = require('../middleware/auth');

// Helper to build a mock req/res/next
function mockHttp(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = {
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; },
    _status: null,
    _body: null,
  };
  const next = jest.fn();
  return { req, res, next };
}

function makeToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body   = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-sig`;
}

describe('verifyToken middleware', () => {
  it('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = mockHttp(undefined);
    verifyToken(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token with wrong number of parts', () => {
    const { req, res, next } = mockHttp('not.a.valid.jwt.parts');
    verifyToken(req, res, next);
    expect(res._status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const token = makeToken({ sub: 'u1', exp: 1000, iat: 900 }); // exp in the past
    const { req, res, next } = mockHttp(token);
    verifyToken(req, res, next);
    expect(res._status).toBe(401);
    expect(res._body.error).toBe('Token expired');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for a valid non-expired token', () => {
    const payload = { sub: 'user-42', exp: 9999999999, iat: 1700000000 };
    const token = makeToken(payload);
    const { req, res, next } = mockHttp(token);
    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ sub: 'user-42' });
  });

  it('calls next() when token has no exp field (no expiry check)', () => {
    const token = makeToken({ sub: 'user-no-exp' });
    const { req, res, next } = mockHttp(token);
    verifyToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
