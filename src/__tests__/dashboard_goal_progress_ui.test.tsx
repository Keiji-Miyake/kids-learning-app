import { describe, it, expect } from 'vitest';
import { getGoalProgress, getEffectiveDailyGoal } from '../utils/goalEvaluator';

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

  it('calculates progress using getEffectiveDailyGoal with active weeklySchedule', () => {
    const mondayGoal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 10,
      targetMinutes: 10,
      rewardText: '月曜のご褒美',
      subjectGoals: {
        english: { targetQuestions: 10, targetMinutes: 5 }
      }
    };

    const profile = {
      id: 'p1',
      name: 'ちひろ',
      avatarEmoji: '👦',
      dailyGoal: {
        goalType: 'total_count' as const,
        targetQuestions: 5,
        targetMinutes: 10,
        rewardText: '基本'
      },
      weeklySchedule: {
        enabled: true,
        days: {
          mon: mondayGoal
        }
      },
      stats: { level: 1, exp: 0, nextLevelExp: 100, coins: 0, unlockedBadges: [], equippedAvatar: 'default' }
    };

    const mondayDate = new Date('2026-09-07T12:00:00Z'); // Monday
    const effective = getEffectiveDailyGoal(profile, mondayDate);
    expect(effective).toEqual(mondayGoal);

    const report: DailyReport = {
      date: '2026-09-07',
      questionsAttempted: 10,
      questionsCorrect: 10,
      subjectMinutes: { math: 0, japanese: 0, science: 0, social: 0, english: 5 },
      subjectBreakdown: { english: { total: 10, correct: 10 } }
    };

    const progress = getGoalProgress(effective, report);
    expect(progress.goalType).toBe('subject_specific');
    expect(progress.isAchieved).toBe(true);
    expect(progress.percent).toBe(100);
  });
});

