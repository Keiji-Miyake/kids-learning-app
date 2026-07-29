import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('厳密なノルマ達成判定テスト (Strict Daily Goal Evaluation)', () => {
  const baseReport: DailyReport = {
    date: '2026-07-27',
    subjectMinutes: { math: 5, japanese: 0, science: 0, social: 0, english: 0 },
    questionsAttempted: 5,
    questionsCorrect: 5
  };

  it('全体目標(5問)のみの場合、5問解けば達成と判定されること', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美'
    };
    expect(checkIsDailyGoalAchieved(goal, baseReport)).toBe(true);
  });

  it('教科別目標(算数5問、国語5问)がある場合、算数5問だけでは達成とならないこと', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 20,
      rewardText: 'ご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 },
        japanese: { targetQuestions: 5, targetMinutes: 10 }
      }
    };
    // 今日のレポートは算数5問のみ
    expect(checkIsDailyGoalAchieved(goal, baseReport)).toBe(false);
  });

  it('教科別目標(算数5問、国語5問)があり、両方の教科の目標をクリアしたときに初めて達成となること', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 20,
      rewardText: 'ご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 },
        japanese: { targetQuestions: 5, targetMinutes: 10 }
      }
    };

    const completedReport: DailyReport = {
      date: '2026-07-27',
      subjectMinutes: { math: 5, japanese: 5, science: 0, social: 0, english: 0 },
      questionsAttempted: 10,
      questionsCorrect: 10
    };

    expect(checkIsDailyGoalAchieved(goal, completedReport)).toBe(true);
  });
});
