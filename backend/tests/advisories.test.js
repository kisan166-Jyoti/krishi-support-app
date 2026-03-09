const request = require('supertest');
const app = require('../app');

describe('Advisories API', () => {
  describe('GET /api/advisories', () => {
    it('returns an array of advisories', async () => {
      const res = await request(app).get('/api/advisories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns at least one advisory', async () => {
      const res = await request(app).get('/api/advisories');
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('each advisory has required fields', async () => {
      const res = await request(app).get('/api/advisories');
      res.body.forEach(a => {
        expect(a).toHaveProperty('id');
        expect(a).toHaveProperty('crop_id');
        expect(a).toHaveProperty('crop_name');
        expect(a).toHaveProperty('title');
        expect(a).toHaveProperty('type');
        expect(a).toHaveProperty('summary');
        expect(a).toHaveProperty('severity');
      });
    });

    it('type field is one of disease, pest, management', async () => {
      const res = await request(app).get('/api/advisories');
      const validTypes = ['disease', 'pest', 'management'];
      res.body.forEach(a => {
        expect(validTypes).toContain(a.type);
      });
    });

    it('severity field is one of low, medium, high', async () => {
      const res = await request(app).get('/api/advisories');
      const validSeverities = ['low', 'medium', 'high'];
      res.body.forEach(a => {
        expect(validSeverities).toContain(a.severity);
      });
    });

    it('filters by cropId', async () => {
      const cropsRes = await request(app).get('/api/crops');
      const cropId = cropsRes.body[0].id;

      const res = await request(app).get(`/api/advisories?cropId=${cropId}`);
      expect(res.status).toBe(200);
      res.body.forEach(a => {
        expect(a.crop_id).toBe(cropId);
      });
    });

    it('filters by type=disease', async () => {
      const res = await request(app).get('/api/advisories?type=disease');
      expect(res.status).toBe(200);
      res.body.forEach(a => {
        expect(a.type).toBe('disease');
      });
    });

    it('filters by type=pest', async () => {
      const res = await request(app).get('/api/advisories?type=pest');
      expect(res.status).toBe(200);
      res.body.forEach(a => expect(a.type).toBe('pest'));
    });

    it('filters by type=management', async () => {
      const res = await request(app).get('/api/advisories?type=management');
      expect(res.status).toBe(200);
      res.body.forEach(a => expect(a.type).toBe('management'));
    });

    it('filters by both cropId and type', async () => {
      const cropsRes = await request(app).get('/api/crops');
      const cropId = cropsRes.body[0].id;

      const res = await request(app).get(`/api/advisories?cropId=${cropId}&type=disease`);
      expect(res.status).toBe(200);
      res.body.forEach(a => {
        expect(a.crop_id).toBe(cropId);
        expect(a.type).toBe('disease');
      });
    });

    it('returns empty array for non-existent cropId', async () => {
      const res = await request(app).get('/api/advisories?cropId=99999');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/advisories/:id', () => {
    it('returns a single advisory for a valid id', async () => {
      const all = await request(app).get('/api/advisories');
      const id = all.body[0].id;

      const res = await request(app).get(`/api/advisories/${id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', id);
      expect(res.body).toHaveProperty('symptoms');
      expect(res.body).toHaveProperty('cause');
      expect(res.body).toHaveProperty('solution');
    });

    it('returns 404 for a non-existent advisory id', async () => {
      const res = await request(app).get('/api/advisories/99999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
