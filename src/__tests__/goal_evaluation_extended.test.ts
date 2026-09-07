import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getSubjectProgressSummary, getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('Extended Daily Goal Evaluation Tests', () => {
  const mockReport: DailyReport = {
    date: '2026-09-07',
    questionsAttempted: 5,
    questionsCorrect: 5,
    totalQuestions: 5,
    subjectMinutes: { math: 6, japanese: 0, science: 0, social: 0, english: 0 },
    subjectBreakdown: {
      math: { total: 5, correct: 5 }
    }
  };

  it('goalType="total_count" checks totalQuestions vs targetQuestions', () => {
    const goalPass: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_count'
    };
    expect(checkIsDailyGoalAchieved(goalPass, mockReport)).toBe(true);

    const goalFail: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_count'
    };
    expect(checkIsDailyGoalAchieved(goalFail, mockReport)).toBe(false);
  });

  it('goalType="total_time" checks totalMinutes vs targetMinutes', () => {
    const goalPass: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 5,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };
    expect(checkIsDailyGoalAchieved(goalPass, mockReport)).toBe(true);

    const goalFail: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };
    expect(checkIsDailyGoalAchieved(goalFail, mockReport)).toBe(false);
  });

  it('goalType="subject_specific" with both questions and minutes requires both to pass', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 } // math has 5 questions (pass) but 6 mins (fail)
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(false);
  });

  it('goalType="subject_specific" passes when both questions and minutes are met', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 5 } // math has 5 questions and 6 mins (both pass)
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(true);
  });

  it('goalType="subject_specific" with only targetMinutes passes if time met', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 0, targetMinutes: 5 }
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(true);
  });

  it('goalType="subject_specific" with only targetQuestions passes if questions met', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 0 }
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(true);
  });

  it('getSubjectProgressSummary returns both question and minute status', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };
    const summary = getSubjectProgressSummary(goal, mockReport);
    expect(summary.math.currentQuestions).toBe(5);
    expect(summary.math.targetQuestions).toBe(5);
    expect(summary.math.currentMinutes).toBe(6);
    expect(summary.math.targetMinutes).toBe(5);
    expect(summary.math.isCompleted).toBe(true);

    expect(summary.japanese.currentQuestions).toBe(0);
    expect(summary.japanese.targetQuestions).toBe(3);
    expect(summary.japanese.isCompleted).toBe(false);
  });

  it('getGoalProgress returns overall percentage and summary label for all modes', () => {
    const countGoal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_count'
    };
    const countProgress = getGoalProgress(countGoal, mockReport);
    expect(countProgress.percent).toBe(50); // 5/10
    expect(countProgress.currentLabel).toBe('5 / 10 問');

    const timeGoal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 12,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };
    const timeProgress = getGoalProgress(timeGoal, mockReport);
    expect(timeProgress.percent).toBe(50); // 6/12
    expect(timeProgress.currentLabel).toBe('6 / 12 分');

    const subjectGoal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };
    const subjectProgress = getGoalProgress(subjectGoal, mockReport);
    expect(subjectProgress.percent).toBe(50); // 1 of 2 subjects completed
    expect(subjectProgress.currentLabel).toBe('1 / 2 教科達成');
    expect(subjectProgress.subjects.length).toBe(2);
  });
});
