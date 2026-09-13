import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../utils/storage';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import { checkIsDailyGoalAchieved, getGoalProgress, getSubjectProgressSummary } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('学習レポート同期の完全性＆単元限定出題テスト (Report Sync Integrity & Unit Isolation Test)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('サーバーの古いレポートデータによって、ローカルで解いた最新の学習セッション（問題数・時間）が消滅しないこと', async () => {
    const profile = storage.getActiveProfile();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. ローカルで算数クイズを解く（15問、180秒）
    storage.addReportData('math', 15, 180, profile.id, 15, {
      grade: 3,
      unitName: 'かけ算九九',
      sessionType: 'quiz'
    });

    const localReportsBefore = storage.getReports(profile.id);
    const todayReportBefore = localReportsBefore.find(r => r.date === todayStr);
    expect(todayReportBefore?.questionsAttempted).toBe(15);
    expect(todayReportBefore?.subjectMinutes.math).toBe(3); // 180秒 = 3分

    // 2. サーバー側には古いデータ（5問、60秒）しか存在しない状態をモック
    const serverOldReports: DailyReport[] = [
      {
        date: todayStr,
        questionsAttempted: 5,
        questionsCorrect: 5,
        totalQuestions: 5,
        subjectMinutes: { math: 1, japanese: 0, science: 0, social: 0, english: 0 },
        subjectBreakdown: { math: { total: 5, correct: 5 } },
        sessions: [
          {
            id: 'old-server-session-1',
            subject: 'math',
            grade: 3,
            unitName: 'かけ算九九',
            sessionType: 'quiz',
            questionsAttempted: 5,
            questionsCorrect: 5,
            durationMinutes: 1,
            timestamp: new Date().toISOString()
          }
        ]
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/reports/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(serverOldReports)
        });
      }
      if (url.includes('/api/profiles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([profile])
        });
      }
      if (url.includes('/api/reviews/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/stats/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      if (url.includes('/api/srs/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    }) as any;

    // 3. サーバー同期を実行
    await storage.syncFromServer();

    // 4. 同期後も、ローカルで解いた15問が消滅せず、サーバーのセッションと合算または最新が保持されていること
    const localReportsAfter = storage.getReports(profile.id);
    const todayReportAfter = localReportsAfter.find(r => r.date === todayStr);

    expect(todayReportAfter).toBeDefined();
    // ローカルで解いた15問が消えて5問に巻き戻っていないこと
    expect(todayReportAfter!.questionsAttempted).toBeGreaterThanOrEqual(15);
    expect(todayReportAfter!.subjectMinutes.math).toBeGreaterThanOrEqual(3);
  });

  it('単元を選択した場合、他単元の問題（無関係な固定問題や総合問題）が混入しないこと', () => {
    // 中2理科「1. 化学変化と原子・分子」を選択
    const unitName = '1. 化学変化と原子・分子';
    const questions = generateUniqueQuizSet('science', 8, 5, unitName);

    expect(questions).toHaveLength(5);
    questions.forEach(q => {
      // 地震やオームの法則などの他単元キーワードが含まれていないこと
      const text = q.questionText + ' ' + q.explanation;
      const isOtherUnit = text.includes('オームの法則') || text.includes('地震') || text.includes('P波') || text.includes('凸レンズ');
      expect(isOtherUnit).toBe(false);
    });
  });

  it('目標設定で問題数(15問)と時間(2分)が両方ある場合、15問解いていれば2分未満でもクリアと判定されること', () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 15,
      targetMinutes: 2,
      rewardText: 'ゲームOK',
      subjectGoals: {
        math: { targetQuestions: 15, targetMinutes: 2 }
      }
    };

    // 15問正解したが、時間は1.08分（2分未満）
    const report: DailyReport = {
      date: '2026-09-13',
      questionsAttempted: 15,
      questionsCorrect: 15,
      subjectMinutes: { math: 1.08, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 15, correct: 15 } }
    };

    const summary = getSubjectProgressSummary(goal, report);
    expect(summary.math.isCompleted).toBe(true);

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 8);
    expect(isAchieved).toBe(true);

    const progress = getGoalProgress(goal, report, 8);
    expect(progress.percent).toBe(100);
    expect(progress.isAchieved).toBe(true);
  });
});
