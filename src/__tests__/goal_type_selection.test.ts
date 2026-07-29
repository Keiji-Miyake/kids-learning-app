import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getSubjectProgressSummary } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('ノルマ判定モード(goalType)選択・評価テスト (Goal Type Selection & Evaluation Test)', () => {
  const mockReports: DailyReport[] = [
    {
      date: new Date().toISOString().split('T')[0],
      questionsAttempted: 5,
      questionsCorrect: 5,
      totalQuestions: 5,
      subjectMinutes: { math: 5, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: {
        math: { total: 5, correct: 5 }
      }
    }
  ];

  it('goalType="total_count" の場合、全体の解答数が達していれば教科別未達成でもノルマ達成と判定されること', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_count',
      subjectGoals: {
        math: { targetQuestions: 3, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, mockReports);
    expect(isAchieved).toBe(true);
  });

  it('goalType="subject_specific" の場合、指定教科(日本語)が0問なら全体5問でも未達成と判定されること', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 3, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, mockReports);
    expect(isAchieved).toBe(false);
  });

  it('教科ごとの進捗サマリーが正確に算出されること', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 3, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };

    const summary = getSubjectProgressSummary(goal, mockReports);
    expect(summary.math).toEqual({ current: 5, target: 3, isCompleted: true });
    expect(summary.japanese).toEqual({ current: 0, target: 3, isCompleted: false });
  });
});
