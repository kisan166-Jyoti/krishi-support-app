const request = require('supertest');
const app = require('../app');

describe('Crops API', () => {
  describe('GET /api/crops', () => {
    it('returns an array of crops', async () => {
      const res = await request(app).get('/api/crops');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns at least one crop', async () => {
      const res = await request(app).get('/api/crops');
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('each crop has required fields', async () => {
      const res = await request(app).get('/api/crops');
      res.body.forEach(crop => {
        expect(crop).toHaveProperty('id');
        expect(crop).toHaveProperty('name');
        expect(crop).toHaveProperty('icon');
        expect(crop).toHaveProperty('description');
      });
    });

    it('returns crops sorted by name', async () => {
      const res = await request(app).get('/api/crops');
      const names = res.body.map(c => c.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('GET /api/crops/:id', () => {
    it('returns a single crop for a valid id', async () => {
      const all = await request(app).get('/api/crops');
      const id = all.body[0].id;

      const res = await request(app).get(`/api/crops/${id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', id);
      expect(res.body).toHaveProperty('name');
    });

    it('returns 404 for a non-existent crop id', async () => {
      const res = await request(app).get('/api/crops/99999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
