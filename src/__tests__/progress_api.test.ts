import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
// @ts-ignore
import app from '../../server.js';

describe('Progress API (/api/progress)', () => {
  it('GET /api/progress/:profileId should return progress data', async () => {
    const res = await supertest(app).get('/api/progress/profile-1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completedUnits');
    expect(Array.isArray(res.body.completedUnits)).toBe(true);
  });

  it('POST /api/progress should add completed unitCode without duplication', async () => {
    const payload = {
      profileId: 'profile-1',
      subject: 'math',
      grade: 3,
      unitCode: 'cos-m3-01'
    };

    const res1 = await supertest(app)
      .post('/api/progress')
      .send(payload);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.completedUnits).toContain('cos-m3-01');

    // 重複送信
    const res2 = await supertest(app)
      .post('/api/progress')
      .send(payload);

    expect(res2.status).toBe(200);
    const count = res2.body.completedUnits.filter((code: string) => code === 'cos-m3-01').length;
    expect(count).toBe(1);
  });
});
