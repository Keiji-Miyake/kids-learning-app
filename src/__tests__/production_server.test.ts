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

  it('PUT /api/reports/:profileId accepts payloads larger than default 100KB', async () => {
    // 200KB超の大きな学習レポート配列ペイロードをシミュレート
    const largeDummyText = 'A'.repeat(150 * 1024); // 150KB
    const payload = [
      {
        date: '2026-09-16',
        questionsAttempted: 20,
        questionsCorrect: 20,
        sessions: [
          {
            id: 'sess-large',
            subject: 'english',
            unitName: '英語大容量テスト',
            questionsAttempted: 20,
            questionsCorrect: 20,
            durationMinutes: 10,
            questionRecords: [
              {
                questionId: 'q-large',
                questionText: largeDummyText,
                selectedAnswer: 'ans',
                correctAnswer: 'ans',
                isCorrect: true,
                explanation: 'exp'
              }
            ]
          }
        ]
      }
    ];

    const res = await supertest(app)
      .put('/api/reports/test-large-payload-profile')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
