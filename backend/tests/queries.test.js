const request = require('supertest');
const app = require('../app');

// A minimal valid JWT with exp far in the future (for testing only)
// Header: { alg: "HS256", typ: "JWT" }
// Payload: { sub: "test-user-1", exp: 9999999999, iat: 1700000000 }
const VALID_TOKEN = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: 'test-user-1', exp: 9999999999, iat: 1700000000 })).toString('base64url'),
  'fake-signature',
].join('.');

describe('Queries API', () => {
  describe('POST /api/queries', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app)
        .post('/api/queries')
        .send({ farmer_name: 'Ramu', question: 'Why are my wheat leaves yellow?' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 401 for an invalid token format', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', 'not-a-jwt')
        .send({ farmer_name: 'Ramu', question: 'Why are my wheat leaves yellow?' });
      expect(res.status).toBe(401);
    });

    it('creates a query with valid token and required fields', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({ farmer_name: 'Ramu Singh', question: 'Why are my wheat leaves yellow?' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.farmer_name).toBe('Ramu Singh');
      expect(res.body.question).toBe('Why are my wheat leaves yellow?');
      expect(res.body.status).toBe('pending');
    });

    it('creates a query with optional crop_id', async () => {
      const cropsRes = await request(app).get('/api/crops');
      const cropId = cropsRes.body[0].id;

      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({ farmer_name: 'Sita Devi', crop_id: cropId, question: 'How to treat rice blast?' });
      expect(res.status).toBe(201);
      expect(res.body.crop_id).toBe(cropId);
    });

    it('returns 400 when farmer_name is missing', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({ question: 'Some question' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when question is missing', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({ farmer_name: 'Ramu' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when both fields are missing', async () => {
      const res = await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/queries', () => {
    it('returns an array of queries', async () => {
      const res = await request(app).get('/api/queries');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('each query has required fields', async () => {
      // First submit one so list is non-empty
      await request(app)
        .post('/api/queries')
        .set('Authorization', VALID_TOKEN)
        .send({ farmer_name: 'Test Farmer', question: 'Test question?' });

      const res = await request(app).get('/api/queries');
      expect(res.body.length).toBeGreaterThan(0);
      const q = res.body[0];
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('farmer_name');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('status');
      expect(q).toHaveProperty('submitted_at');
    });
  });
});
