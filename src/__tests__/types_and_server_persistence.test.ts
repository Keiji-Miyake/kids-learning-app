import { describe, it, expect } from 'vitest';
import request from 'supertest';
// @ts-ignore
import app from '../../server.js';
import type { DailyGoal } from '../types';

describe('Goal types and Server persistence test', () => {
  it('should accept extended dailyGoal with goalType and subjectGoals targetMinutes', async () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'テストご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };
    expect(goal.goalType).toBe('subject_specific');
    expect(goal.subjectGoals?.math?.targetMinutes).toBe(10);
  });

  it('GET /api/profiles should return valid array even if db.json is missing fields', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
