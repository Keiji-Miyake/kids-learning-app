import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { checkIsDailyGoalAchieved, getGoalProgress } from '../utils/goalEvaluator';
import { storage } from '../utils/storage';
import { ParentDashboard } from '../components/ParentDashboard';
import type { DailyGoal, DailyReport } from '../types';

describe('子ども画面と保護者管理画面のノルマ達成判定・同期不一致修復テスト', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('時間ノルマ（10分）設定時、9.95分（四捨五入10.0分）で checkIsDailyGoalAchieved と getGoalProgress.isAchieved が両方とも達成(true)になること', () => {
    const timeGoal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美ゲーム',
      goalType: 'total_time'
    };

    // 9.95分（秒換算: 597秒）
    const reportNear10Min: DailyReport = {
      date: new Date().toISOString().split('T')[0],
      questionsAttempted: 15,
      questionsCorrect: 15,
      subjectMinutes: { math: 9.95, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 's1',
          subject: 'math',
          grade: 3,
          questionsAttempted: 15,
          questionsCorrect: 15,
          durationMinutes: 9.95,
          durationSeconds: 597,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(timeGoal, reportNear10Min, 3);
    const progress = getGoalProgress(timeGoal, reportNear10Min, 3);

    expect(isAchieved).toBe(true);
    expect(progress.isAchieved).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it('小学3年生のお子様が苦手復習として前学年の問題を解いた場合でも、時間ノルマ（学習時間重視）では全学習時間が正当に評価されノルマ達成になること', () => {
    const timeGoal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };

    // 小学1年の問題を10分かけて解いたレポート
    const reviewReport: DailyReport = {
      date: new Date().toISOString().split('T')[0],
      questionsAttempted: 20,
      questionsCorrect: 18,
      subjectMinutes: { math: 10.0, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 's-review',
          subject: 'math',
          grade: 1, // 前学年の復習
          questionsAttempted: 20,
          questionsCorrect: 18,
          durationMinutes: 10.0,
          durationSeconds: 600,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // お子様の登録学年が小3であっても、時間ノルマ（努力した時間そのもの）では10分学習したことが正当に評価されるべき
    const isAchieved = checkIsDailyGoalAchieved(timeGoal, reviewReport, 3);
    const progress = getGoalProgress(timeGoal, reviewReport, 3);

    expect(isAchieved).toBe(true);
    expect(progress.isAchieved).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.currentLabel).toBe('10 / 10 分');
  });

  it('fetchReportsAsync 実行時、ローカルの subjectMinutes がセッション結合によって減衰・消失せず最大値で保護されること', async () => {
    const profileId = 'profile-chihiro';

    // ローカルに 12分 の学習記録がある
    const localReport: DailyReport = {
      date: new Date().toISOString().split('T')[0],
      questionsAttempted: 20,
      questionsCorrect: 19,
      subjectMinutes: { math: 12.0, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 'sess-1',
          subject: 'math',
          grade: 3,
          questionsAttempted: 20,
          questionsCorrect: 19,
          durationMinutes: 12.0,
          timestamp: new Date().toISOString()
        }
      ]
    };

    localStorage.setItem(`kids_learnquest_reports_${profileId}`, JSON.stringify([localReport]));

    // サーバーからはセッションなし（または0分）の空のレポートが返るモック
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => [
          {
            date: new Date().toISOString().split('T')[0],
            questionsAttempted: 0,
            questionsCorrect: 0,
            subjectMinutes: { math: 0, japanese: 0, science: 0, social: 0, english: 0 },
            sessions: []
          }
        ]
      } as unknown as Response;
    };

    const syncedReports = await storage.fetchReportsAsync(profileId);
    const today = syncedReports.find(r => r.date === new Date().toISOString().split('T')[0]);

    expect(today).toBeDefined();
    // ローカルの12分が消失せず維持されること
    expect(today!.subjectMinutes.math).toBeGreaterThanOrEqual(12.0);
    expect(today!.questionsAttempted).toBe(20);
  });

  it('ParentDashboard に initialProfileId を渡した際、そのプロファイルが初期選択されること', async () => {
    storage.setParentAuthenticated(true);

    // プレイヤー「ちひろ」を追加
    const chihiro = storage.addProfile(
      'ちひろ',
      '👧',
      3,
      undefined,
      {
        targetQuestions: 5,
        targetMinutes: 10,
        rewardText: 'ご褒美',
        goalType: 'total_time'
      }
    );

    render(React.createElement(ParentDashboard, { onClose: () => {}, initialProfileId: chihiro.id }));

    // 「ちひろ さんのデータ」タブが active になっていること
    const chihiroTab = await screen.findByRole('button', { name: /ちひろ さんのデータ/ });
    expect(chihiroTab.className).toContain('active');
  });
});
