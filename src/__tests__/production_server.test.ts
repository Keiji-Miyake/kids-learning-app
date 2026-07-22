import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
// @ts-ignore
import app from '../../server.js';

describe('Production Server SPA Static Serving', () => {
  it('GET / non-api route should serve static html when dist exists or 404/fallback appropriately', async () => {
    const res = await supertest(app).get('/');
    // まだ static 配信を組み込んでいないため / ルートは 404 が返る (Red)
    expect(res.status).toBe(200);
  });
});
