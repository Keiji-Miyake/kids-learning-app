import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('学年別ノルマ達成フィルタリングテスト', () => {
  const goal: DailyGoal = {
    targetQuestions: 5,
    targetMinutes: 10,
    rewardText: 'ご褒美',
    goalType: 'total_count'
  };

  it('小学3年生のお子様が小学1年生の問題（低学年）を5問解いてもノルマ達成にならない', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 1, // 低学年の問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // profileGrade = 3 を指定した場合
    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(false);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.percent).toBe(0);
    expect(progress.isAchieved).toBe(false);
  });

  it('小学3年生のお子様が小学3年生の問題（現学年）を5問解いた場合はノルマ達成になる', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 3, // 現学年の問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(true);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.percent).toBe(100);
    expect(progress.isAchieved).toBe(true);
  });

  it('小学3年生のお子様が小学4年生の問題（先取り学習）を5問解いた場合もノルマ達成になる', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 4, // 先取り問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(true);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.percent).toBe(100);
    expect(progress.isAchieved).toBe(true);
  });

  it('小1の問題を3問、小3の問題を2問解いた場合、ノルマ対象は2問（進捗40%）となる', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 1, // 低学年
          questionsAttempted: 3,
          questionsCorrect: 3,
          durationMinutes: 5,
          timestamp: new Date().toISOString()
        },
        {
          subject: 'math',
          grade: 3, // 現学年
          questionsAttempted: 2,
          questionsCorrect: 2,
          durationMinutes: 5,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(false);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.currentLabel).toBe('2 / 5 問');
    expect(progress.percent).toBe(40);
    expect(progress.isAchieved).toBe(false);
  });

  it('セッション情報がない古いレポートの場合は後方互換で全体数で判定する', () => {
    const legacyReport: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, legacyReport, 3);
    expect(isAchieved).toBe(true);
  });
});
