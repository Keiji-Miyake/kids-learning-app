import { describe, it, expect } from 'vitest';
import { getEffectiveDailyGoal } from '../utils/goalEvaluator';
import type { UserProfile, DailyGoal } from '../types';

describe('Weekly Schedule Goal Evaluator Tests', () => {
  const baseGoal: DailyGoal = {
    targetQuestions: 5,
    targetMinutes: 10,
    rewardText: '基本のご褒美',
    goalType: 'total_count'
  };

  const mondayGoal: DailyGoal = {
    targetQuestions: 20,
    targetMinutes: 15,
    rewardText: '月曜のご褒美',
    goalType: 'subject_specific',
    subjectGoals: {
      math: { targetQuestions: 10, targetMinutes: 5 },
      english: { targetQuestions: 10, targetMinutes: 5 }
    }
  };

  const sampleProfile: UserProfile = {
    id: 'test-user-1',
    name: 'テスト君',
    avatarEmoji: '👦',
    dailyGoal: baseGoal,
    stats: {
      level: 1,
      exp: 0,
      nextLevelExp: 100,
      coins: 0,
      unlockedBadges: [],
      equippedAvatar: { base: 'default', hat: 'none', accessory: 'none', companion: 'none' },
      streak: 1,
      lastActiveDate: '2026-09-07',
      ownedItems: []
    }
  };


  it('returns base dailyGoal when weeklySchedule is undefined or disabled', () => {
    // 1. undefined
    expect(getEffectiveDailyGoal(sampleProfile)).toEqual(baseGoal);

    // 2. disabled
    const disabledProfile: UserProfile = {
      ...sampleProfile,
      weeklySchedule: {
        enabled: false,
        days: {
          mon: mondayGoal
        }
      }
    };
    // 2026-09-07 is Monday
    const mondayDate = new Date('2026-09-07T12:00:00Z');
    expect(getEffectiveDailyGoal(disabledProfile, mondayDate)).toEqual(baseGoal);
  });

  it('returns day-specific goal when weeklySchedule is enabled and matching day exists', () => {
    const enabledProfile: UserProfile = {
      ...sampleProfile,
      weeklySchedule: {
        enabled: true,
        days: {
          mon: mondayGoal
        }
      }
    };
    const mondayDate = new Date('2026-09-07T12:00:00Z'); // 2026-09-07 is Monday
    expect(getEffectiveDailyGoal(enabledProfile, mondayDate)).toEqual(mondayGoal);
  });

  it('falls back to base dailyGoal when weeklySchedule is enabled but target day is not configured', () => {
    const enabledProfile: UserProfile = {
      ...sampleProfile,
      weeklySchedule: {
        enabled: true,
        days: {
          mon: mondayGoal // only mon is set
        }
      }
    };
    const tuesdayDate = new Date('2026-09-08T12:00:00Z'); // 2026-09-08 is Tuesday
    expect(getEffectiveDailyGoal(enabledProfile, tuesdayDate)).toEqual(baseGoal);
  });

  it('returns a safe fallback goal when both dailyGoal and day goal are missing', () => {
    const emptyProfile: UserProfile = {
      ...sampleProfile,
      dailyGoal: undefined
    };
    const goal = getEffectiveDailyGoal(emptyProfile);
    expect(goal).toBeDefined();
    expect(goal.targetQuestions).toBeGreaterThan(0);
    expect(goal.rewardText).toBeTruthy();
  });
});
