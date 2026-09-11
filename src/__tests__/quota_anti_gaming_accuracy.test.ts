import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('ノルマ連打対策：正答率50%以上判定テスト (Quota Anti-Gaming Accuracy Tests)', () => {
  it('目標問題数に達していても、正答率が50%未満（適当な連打）の場合はノルマ未達成となること', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      goalType: 'total_count',
      reward: '10分ゲーム'
    };

    // 10問解いたが、連打で3問しか正解していない（正答率30%）
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 10,
      questionsCorrect: 3,
      totalQuestions: 10,
      subjectMinutes: { math: 5, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: {
        math: { total: 10, correct: 3 }
      }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report);
    expect(isAchieved).toBe(false);
  });

  it('目標問題数に達しており、正答率が50%以上（真面目に解答）の場合はノルマ達成となること', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      goalType: 'total_count',
      reward: '10分ゲーム'
    };

    // 10問解いて5問正解（正答率50%）
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 10,
      questionsCorrect: 5,
      totalQuestions: 10,
      subjectMinutes: { math: 5, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: {
        math: { total: 10, correct: 5 }
      }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report);
    expect(isAchieved).toBe(true);
  });

  it('科目別目標でも、該当科目の正答率が50%未満の場合は未達成となること', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      goalType: 'subject_specific',
      reward: '10分ゲーム',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 0 }
      }
    };

    // 算数を5問解いたが1問しか正解していない（正答率20%）
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 1,
      totalQuestions: 5,
      subjectMinutes: { math: 5, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: {
        math: { total: 5, correct: 1 }
      }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report);
    expect(isAchieved).toBe(false);
  });
});
