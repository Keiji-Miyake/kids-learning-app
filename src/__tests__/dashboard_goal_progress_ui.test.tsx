import { describe, it, expect } from 'vitest';
import { getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('Goal Progress UI Helper & Display Tests', () => {
  it('formats subject-specific progress for math (both questions & minutes)', () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 }
      }
    };
    const report: DailyReport = {
      date: '2026-09-07',
      questionsAttempted: 2,
      questionsCorrect: 2,
      subjectMinutes: { math: 3, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 2, correct: 2 } }
    };

    const progress = getGoalProgress(goal, report);
    const mathProg = progress.subjects.find(s => s.subject === 'math');
    expect(mathProg?.label).toContain('2 / 5問');
    expect(mathProg?.label).toContain('3 / 10分');
    expect(mathProg?.isCompleted).toBe(false);
  });

  it('formats total_time progress with minutes', () => {
    const goal: DailyGoal = {
      goalType: 'total_time',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美'
    };
    const report: DailyReport = {
      date: '2026-09-07',
      questionsAttempted: 2,
      questionsCorrect: 2,
      subjectMinutes: { math: 4, japanese: 3, science: 0, social: 0, english: 0 }
    };

    const progress = getGoalProgress(goal, report);
    expect(progress.goalType).toBe('total_time');
    expect(progress.percent).toBe(70);
    expect(progress.currentLabel).toBe('7 / 10 分');
  });
});
