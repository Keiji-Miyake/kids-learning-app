import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../utils/storage';
import { checkIsDailyGoalAchieved, getGoalProgress, getEffectiveDailyGoal, getSubjectProgressSummary } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('新目標値反映および科目別目標（問題数＋時間）の厳格判定テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('科目別目標で算数（10問、目標時間なし=0分）を設定した場合、問題数が10問未満なら達成にならず、10問到達で達成になること', () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      subjectGoals: {
        math: { targetQuestions: 10, targetMinutes: 0 },
        japanese: { targetQuestions: 0, targetMinutes: 0 },
        science: { targetQuestions: 0, targetMinutes: 0 },
        social: { targetQuestions: 0, targetMinutes: 0 },
        english: { targetQuestions: 0, targetMinutes: 0 }
      }
    };

    // 算数を5問解いた（時間は6分経過）レポート
    const report5Questions6Min: DailyReport = {
      date: '2026-10-19',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 6, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 5, correct: 5 } }
    };

    // 目標問題数（10問）に達していないため、未達成であること！
    const summary5Q = getSubjectProgressSummary(goal, report5Questions6Min);
    expect(summary5Q.math.isCompleted).toBe(false);
    expect(checkIsDailyGoalAchieved(goal, report5Questions6Min)).toBe(false);

    // 算数を10問解いたレポート
    const report10Questions6Min: DailyReport = {
      date: '2026-10-19',
      questionsAttempted: 10,
      questionsCorrect: 10,
      subjectMinutes: { math: 6, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 10, correct: 10 } }
    };

    // 問題数（10問）を満たしたため達成！
    const summary10Q = getSubjectProgressSummary(goal, report10Questions6Min);
    expect(summary10Q.math.isCompleted).toBe(true);
    expect(checkIsDailyGoalAchieved(goal, report10Questions6Min)).toBe(true);
  });

  it('古いノルマで一度達成した後にノルマを引き上げた場合、新しい目標値が反映され未達成状態に戻ること', () => {
    const profile = storage.getActiveProfile();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. 最初は5問ノルマ
    const initialGoal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: '最初のご褒美',
      goalType: 'total_count',
      updatedAt: 1000
    };
    storage.updateProfile({
      ...profile,
      dailyGoal: initialGoal
    });

    // 5問解いたレポート
    const report5Q: DailyReport = {
      date: todayStr,
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 2, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 5, correct: 5 } }
    };

    // 5問の時点では達成している
    expect(checkIsDailyGoalAchieved(initialGoal, report5Q)).toBe(true);
    expect(getGoalProgress(initialGoal, report5Q).isAchieved).toBe(true);

    // 2. 保護者がノルマを15問に引き上げ
    const updatedGoal: DailyGoal = {
      targetQuestions: 15,
      targetMinutes: 10,
      rewardText: '新しいご褒美',
      goalType: 'total_count',
      updatedAt: 2000
    };
    storage.updateProfile({
      ...profile,
      dailyGoal: updatedGoal
    });

    const latestProfile = storage.getActiveProfile();
    const effectiveGoal = getEffectiveDailyGoal(latestProfile);
    expect(effectiveGoal.targetQuestions).toBe(15);

    // 5問解いた状態では、新しいノルマ（15問）に対して未達成であること！
    expect(checkIsDailyGoalAchieved(effectiveGoal, report5Q)).toBe(false);
    const progress = getGoalProgress(effectiveGoal, report5Q);
    expect(progress.isAchieved).toBe(false);
    expect(progress.currentLabel).toBe('5 / 15 問');
    expect(progress.percent).toBe(33);
  });

  it('syncFromServer 実行時、ローカルの新しい dailyGoal/weeklySchedule がサーバーの古い設定で上書きされないこと', async () => {
    const profile = storage.getActiveProfile();

    // ローカルで新しく設定したノルマ (updatedAt: 5000)
    const newLocalGoal: DailyGoal = {
      targetQuestions: 20,
      targetMinutes: 30,
      rewardText: '最新のご褒美！',
      goalType: 'total_count',
      updatedAt: 5000
    };
    storage.updateProfile({
      ...profile,
      dailyGoal: newLocalGoal
    });

    // サーバーには古いノルマ (updatedAt: 1000) が残っているレスポンス
    const serverProfiles = [
      {
        id: profile.id,
        name: profile.name,
        avatarEmoji: profile.avatarEmoji,
        grade: profile.grade,
        dailyGoal: {
          targetQuestions: 5,
          targetMinutes: 10,
          rewardText: '古いご褒美',
          goalType: 'total_count',
          updatedAt: 1000
        }
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/profiles') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(serverProfiles) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    await storage.syncFromServer();

    const afterSync = storage.getActiveProfile();
    expect(afterSync.dailyGoal?.targetQuestions).toBe(20);
    expect(afterSync.dailyGoal?.rewardText).toBe('最新のご褒美！');
  });

  it('子端末に古い1分のローカルキャッシュがある場合でも、サーバーの更新された2分ノルマがsyncFromServerで確実に反映されること', async () => {
    const profile = storage.getActiveProfile();

    // 子端末の古いローカルキャッシュ（各教科1分、古いtimestampまたはtimestampなし）
    const staleLocalGoal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: '古いご褒美',
      subjectGoals: {
        math: { targetQuestions: 15, targetMinutes: 1 },
        japanese: { targetQuestions: 10, targetMinutes: 1 },
        science: { targetQuestions: 10, targetMinutes: 1 },
        social: { targetQuestions: 10, targetMinutes: 1 },
        english: { targetQuestions: 15, targetMinutes: 1 }
      },
      updatedAt: 1000
    };
    storage.updateProfile({
      ...profile,
      dailyGoal: staleLocalGoal
    });

    // サーバーには保護者が「全部2分にした」最新設定 (updatedAt: 5000)
    const serverUpdatedGoal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ゲームOK！',
      subjectGoals: {
        math: { targetQuestions: 15, targetMinutes: 2 },
        japanese: { targetQuestions: 10, targetMinutes: 2 },
        science: { targetQuestions: 10, targetMinutes: 2 },
        social: { targetQuestions: 10, targetMinutes: 2 },
        english: { targetQuestions: 15, targetMinutes: 2 }
      },
      updatedAt: 5000
    };
    const serverProfiles = [
      {
        id: profile.id,
        name: profile.name,
        avatarEmoji: profile.avatarEmoji,
        grade: profile.grade,
        dailyGoal: serverUpdatedGoal,
        weeklySchedule: { enabled: false, days: {} }
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/profiles') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(serverProfiles) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    await storage.syncFromServer();

    const afterSync = storage.getActiveProfile();
    const effectiveGoal = getEffectiveDailyGoal(afterSync);
    expect(effectiveGoal.subjectGoals?.math?.targetMinutes).toBe(2);
    expect(effectiveGoal.subjectGoals?.japanese?.targetMinutes).toBe(2);
    expect(effectiveGoal.subjectGoals?.science?.targetMinutes).toBe(2);
    expect(effectiveGoal.subjectGoals?.social?.targetMinutes).toBe(2);
    expect(effectiveGoal.subjectGoals?.english?.targetMinutes).toBe(2);
  });
});
