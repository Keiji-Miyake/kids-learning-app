import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../utils/storage';
import { checkIsDailyGoalAchieved, getGoalProgress, getEffectiveDailyGoal } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport, UserProfile, WeeklySchedule } from '../types';

describe('ノルマ反映不良（時間ノルマと問題数ノルマの切り替え）＆ 学習レポート同期修復テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('時間ノルマ（10分）設定時、20問解いても学習時間が10分未満ならノルマ達成にならず、10分到達で達成になること', () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // 時間ノルマ（10分）のゴール
    const timeGoal: DailyGoal = {
      goalType: 'total_time',
      targetMinutes: 10,
      targetQuestions: 5, // 残留値があっても時間重視が優先されるべき
      rewardText: '🎮 ゲーム30分OK！'
    };

    // 20問解いたが、所要時間は4分（240秒）のレポート
    const report20QuestionsShortTime: DailyReport = {
      date: todayStr,
      questionsAttempted: 20,
      questionsCorrect: 18,
      totalQuestions: 20,
      subjectMinutes: { math: 4, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 20, correct: 18 } },
      sessions: []
    };

    // 時間ノルマなので4分では未達成であること
    const isAchieved4Min = checkIsDailyGoalAchieved(timeGoal, report20QuestionsShortTime);
    expect(isAchieved4Min).toBe(false);

    const progress4Min = getGoalProgress(timeGoal, report20QuestionsShortTime);
    expect(progress4Min.goalType).toBe('total_time');
    expect(progress4Min.isAchieved).toBe(false);
    expect(progress4Min.currentLabel).toBe('4 / 10 分');
    expect(progress4Min.percent).toBe(40);

    // 学習時間が10分（合計10分）に達したレポート
    const report10Minutes: DailyReport = {
      date: todayStr,
      questionsAttempted: 20,
      questionsCorrect: 18,
      totalQuestions: 20,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 20, correct: 18 } },
      sessions: []
    };

    const isAchieved10Min = checkIsDailyGoalAchieved(timeGoal, report10Minutes);
    expect(isAchieved10Min).toBe(true);

    const progress10Min = getGoalProgress(timeGoal, report10Minutes);
    expect(progress10Min.isAchieved).toBe(true);
    expect(progress10Min.currentLabel).toBe('10 / 10 分');
    expect(progress10Min.percent).toBe(100);
  });

  it('syncFromServer を実行した際、プロファイルの weeklySchedule が消去されずに維持されること', async () => {
    // 1. プロファイル作成（ちひろ）
    const chihiro = storage.addProfile('ちひろ', '👧', 3);
    const weekly: WeeklySchedule = {
      enabled: true,
      days: {
        mon: { goalType: 'total_time', targetQuestions: 5, targetMinutes: 15, rewardText: '月曜ご褒美' },
        tue: { goalType: 'total_time', targetQuestions: 5, targetMinutes: 20, rewardText: '火曜ご褒美' },
        wed: { goalType: 'total_count', targetQuestions: 10, targetMinutes: 10, rewardText: '水曜ご褒美' }
      }
    };

    const chihiroWithSchedule: UserProfile = {
      ...chihiro,
      weeklySchedule: weekly
    };
    storage.updateProfile(chihiroWithSchedule);

    // 2. サーバー側（server.js）は weeklySchedule を保持していない通常のレスポンスをシミュレート
    const serverProfiles = [
      {
        id: chihiro.id,
        name: chihiro.name,
        avatarEmoji: chihiro.avatarEmoji,
        grade: chihiro.grade,
        dailyGoal: chihiro.dailyGoal
        // weeklySchedule はサーバー側で未対応のため含まれない
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/profiles') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(serverProfiles) });
      }
      if (url.includes('/api/reviews/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/reports/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/stats/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
      }
      if (url.includes('/api/srs/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await storage.syncFromServer();

    const syncedChihiro = storage.getProfile(chihiro.id);
    expect(syncedChihiro).toBeDefined();
    expect(syncedChihiro?.weeklySchedule).toBeDefined();
    expect(syncedChihiro?.weeklySchedule?.enabled).toBe(true);
    expect(syncedChihiro?.weeklySchedule?.days?.mon?.targetMinutes).toBe(15);
  });

  it('サーバー同期時、ローカルで最新に更新した時間ノルマがサーバーの古い問題数ノルマ（20問）で上書きされないこと', async () => {
    const profile = storage.getActiveProfile();

    // ローカルで時間ノルマ（15分）に更新
    const localTimeGoal: DailyGoal = {
      goalType: 'total_time',
      targetMinutes: 15,
      targetQuestions: 5,
      rewardText: '時間ノルマご褒美'
    };
    storage.updateProfile({
      ...profile,
      dailyGoal: localTimeGoal
    });

    // サーバーには古い20問ノルマが残っている状況をシミュレート
    const serverOldGoal: DailyGoal = {
      goalType: 'total_count',
      targetQuestions: 20,
      targetMinutes: 10,
      rewardText: '古い20問ご褒美'
    };
    const serverProfiles = [
      {
        id: profile.id,
        name: profile.name,
        avatarEmoji: profile.avatarEmoji,
        grade: profile.grade,
        dailyGoal: serverOldGoal
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/profiles') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(serverProfiles) });
      }
      if (url.includes('/api/reviews/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/reports/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/stats/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
      }
      if (url.includes('/api/srs/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await storage.syncFromServer();

    const reloaded = storage.getProfile(profile.id);
    expect(reloaded?.dailyGoal?.goalType).toBe('total_time');
    expect(reloaded?.dailyGoal?.targetMinutes).toBe(15);
  });

  it('storage.fetchReportsAsync により、他端末からサーバーに保存された最新レポートをフェッチ・マージできること', async () => {
    const chihiro = storage.addProfile('ちひろ', '👧', 3);
    const todayStr = new Date().toISOString().split('T')[0];

    // ローカルにはレポートが存在しない
    expect(storage.getReports(chihiro.id).length).toBe(0);

    // サーバーには別端末で解いた20問のレポートが存在する
    const serverReports: DailyReport[] = [
      {
        date: todayStr,
        questionsAttempted: 20,
        questionsCorrect: 19,
        totalQuestions: 20,
        subjectMinutes: { math: 12, japanese: 0, science: 0, social: 0, english: 0 },
        subjectBreakdown: { math: { total: 20, correct: 19 } },
        sessions: [
          {
            id: 'sess-remote-1',
            subject: 'math',
            grade: 3,
            unitName: 'わり算',
            sessionType: 'quiz',
            questionsAttempted: 20,
            questionsCorrect: 19,
            durationMinutes: 12,
            timestamp: new Date().toISOString()
          }
        ]
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/reports/${chihiro.id}`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(serverReports)
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve([])
      });
    });

    const fetchedReports = await (storage as any).fetchReportsAsync(chihiro.id);

    expect(fetchedReports.length).toBe(1);
    expect(fetchedReports[0].questionsAttempted).toBe(20);
    expect(fetchedReports[0].subjectMinutes.math).toBe(12);

    // ローカルストレージにも保存されていること
    const stored = storage.getReports(chihiro.id);
    expect(stored.length).toBe(1);
    expect(stored[0].questionsAttempted).toBe(20);
  });

  it('保護者ダッシュボードでノルマを時間ノルマ（10分）に保存後、最新プロファイルを取得すると時間ノルマが反映され、クイズ判定も時間で行われること', () => {
    const profile = storage.getActiveProfile();
    const todayStr = new Date().toISOString().split('T')[0];

    // 親が時間ノルマ（10分）を設定して保存
    const newTimeGoal: DailyGoal = {
      goalType: 'total_time',
      targetMinutes: 10,
      targetQuestions: 5,
      rewardText: '時間ノルマ達成ご褒美'
    };

    storage.updateProfile({
      ...profile,
      dailyGoal: newTimeGoal
    });

    // App.tsx の onClose で呼ばれる getActiveProfile()
    const latestProfile = storage.getActiveProfile();
    expect(latestProfile.dailyGoal?.goalType).toBe('total_time');
    expect(latestProfile.dailyGoal?.targetMinutes).toBe(10);

    // 20問解いた（所要時間4分）レポート
    const report20Questions = [
      {
        date: todayStr,
        questionsAttempted: 20,
        questionsCorrect: 19,
        totalQuestions: 20,
        subjectMinutes: { math: 4, japanese: 0, science: 0, social: 0, english: 0 },
        subjectBreakdown: { math: { total: 20, correct: 19 } },
        sessions: []
      }
    ];

    const effectiveGoal = getEffectiveDailyGoal(latestProfile);
    expect(effectiveGoal.goalType).toBe('total_time');

    // 20問解いても、時間（4分 < 10分）未達なら達成にならないこと！
    const isAchieved = checkIsDailyGoalAchieved(effectiveGoal, report20Questions);
    expect(isAchieved).toBe(false);

    // 10分勉強したレポートなら達成になること！
    const report10Min = [
      {
        date: todayStr,
        questionsAttempted: 20,
        questionsCorrect: 19,
        totalQuestions: 20,
        subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
        subjectBreakdown: { math: { total: 20, correct: 19 } },
        sessions: []
      }
    ];
    const isAchieved10Min = checkIsDailyGoalAchieved(effectiveGoal, report10Min);
    expect(isAchieved10Min).toBe(true);
  });

  it('レポート同期時にセッションIDがない古いセッションがあっても同一キーで上書き消去されず、問題数が保持されること', async () => {
    const profile = storage.getActiveProfile();
    const todayStr = new Date().toISOString().split('T')[0];

    // ローカルに算数セッション2回分（各5問、計10問）
    storage.addReportData('math', 5, 120, profile.id, 5);
    storage.addReportData('math', 4, 120, profile.id, 5);

    const localReportsBefore = storage.getReports(profile.id);
    expect(localReportsBefore[0].questionsAttempted).toBe(10);

    // サーバーには1回分（5問）しかない状態
    const serverReports = [
      {
        date: todayStr,
        questionsAttempted: 5,
        questionsCorrect: 5,
        totalQuestions: 5,
        subjectMinutes: { math: 2, japanese: 0, science: 0, social: 0, english: 0 },
        sessions: [
          {
            subject: 'math' as const,
            questionsAttempted: 5,
            questionsCorrect: 5,
            durationMinutes: 2,
            timestamp: new Date().toISOString()
          }
        ]
      }
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === `/api/reports/${profile.id}`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(serverReports) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
    });

    const merged = await storage.fetchReportsAsync(profile.id);
    // マージ後もローカルで解いた10問が消えず、保持または増加していること
    expect(merged[0].questionsAttempted).toBeGreaterThanOrEqual(10);
  });

  it('万が一通常レポートキーが消失した場合でも、バックアップから自動復元されること', () => {
    const profile = storage.getActiveProfile();
    const key = `kids_learnquest_reports_${profile.id}`;

    // レポートを記録（20問）
    storage.addReportData('math', 18, 600, profile.id, 20);
    const reportsBefore = storage.getReports(profile.id);
    expect(reportsBefore[0].questionsAttempted).toBe(20);

    // 通常キーが何らかの原因で消去された（undefined / null）
    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();

    // storage.getReports() を呼び出すと、バックアップキーから自動復旧されること
    const restored = storage.getReports(profile.id);
    expect(restored.length).toBe(1);
    expect(restored[0].questionsAttempted).toBe(20);
    expect(localStorage.getItem(key)).not.toBeNull(); // 通常キーも再生成されていること
  });
});
