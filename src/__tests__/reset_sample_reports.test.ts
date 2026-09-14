import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage, isSampleSession, sanitizeReports } from '../utils/storage';
import type { DailyReport, QuizSession } from '../types';

describe('サンプル学習履歴の自動除去・本日履歴リセットテスト', () => {
  const profileId = 'profile-1';

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('isSampleSession が sample- プレフィックスの問題IDを含むセッションを正しく判定できること', () => {
    const sampleSession: QuizSession = {
      id: 'sess-sample-1',
      subject: 'math',
      unitName: '九九・かけ算',
      questionsAttempted: 5,
      questionsCorrect: 4,
      durationMinutes: 3,
      durationSeconds: 180,
      timestamp: new Date().toISOString(),
      questionRecords: [
        {
          questionId: 'sample-math-1',
          questionText: '3 × 4 は いくらかな？',
          selectedAnswer: '12',
          correctAnswer: '12',
          isCorrect: true,
          explanation: '3 × 4 = 12 です。'
        } as any
      ]
    };

    const realSession: QuizSession = {
      id: 'sess-real-1',
      subject: 'math',
      grade: 8,
      unitName: '1. 式の計算・連立方程式',
      questionsAttempted: 5,
      questionsCorrect: 5,
      durationMinutes: 2,
      durationSeconds: 120,
      timestamp: new Date().toISOString(),
      questionRecords: [
        {
          questionId: 'dyn-m8-sys-12345',
          questionText: '連立方程式を解きなさい',
          selectedAnswer: 'x = 2, y = 6',
          correctAnswer: 'x = 2, y = 6',
          isCorrect: true,
          explanation: '正解です。'
        } as any
      ]
    };

    expect(isSampleSession(sampleSession)).toBe(true);
    expect(isSampleSession(realSession)).toBe(false);
  });

  it('sanitizeReports がサンプルセッションのみの本日レポートを完全に除去・リセットすること', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastStr = '2026-09-13';

    const pastReport: DailyReport = {
      date: pastStr,
      questionsAttempted: 90,
      questionsCorrect: 80,
      subjectMinutes: { math: 15, japanese: 10, science: 5, social: 5, english: 5 },
      sessions: [
        {
          id: 'sess-past',
          subject: 'math',
          grade: 8,
          questionsAttempted: 10,
          questionsCorrect: 10,
          durationMinutes: 5,
          timestamp: '2026-09-13T07:45:00.000Z',
          questionRecords: [{ questionId: 'past-q-1', isCorrect: true } as any]
        }
      ]
    };

    const todaySampleReport: DailyReport = {
      date: todayStr,
      questionsAttempted: 8,
      questionsCorrect: 7,
      subjectMinutes: { math: 3, japanese: 2, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 'sess-s-math',
          subject: 'math',
          unitName: '九九・かけ算',
          questionsAttempted: 5,
          questionsCorrect: 4,
          durationMinutes: 3,
          timestamp: new Date().toISOString(),
          questionRecords: [{ questionId: 'sample-math-1', isCorrect: true } as any]
        },
        {
          id: 'sess-s-jp',
          subject: 'japanese',
          unitName: '漢字の読み書き',
          questionsAttempted: 3,
          questionsCorrect: 3,
          durationMinutes: 2,
          timestamp: new Date().toISOString(),
          questionRecords: [{ questionId: 'sample-jp-1', isCorrect: true } as any]
        }
      ]
    };

    const reports = [pastReport, todaySampleReport];
    const sanitized = sanitizeReports(reports);

    // 今日のサンプルレポートが除去され、過去の本物のレポートのみが残ること
    expect(sanitized.length).toBe(1);
    expect(sanitized[0].date).toBe(pastStr);
    expect(sanitized.find(r => r.date === todayStr)).toBeUndefined();
  });

  it('本物のセッションとサンプルセッションが混ざっていた場合、サンプルセッションのみが除外され、本物のセッションで再集計されること', () => {
    const todayStr = new Date().toISOString().split('T')[0];

    const mixedTodayReport: DailyReport = {
      date: todayStr,
      questionsAttempted: 15,
      questionsCorrect: 14,
      subjectMinutes: { math: 5, japanese: 2, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 'sess-s-math',
          subject: 'math',
          unitName: '九九・かけ算',
          questionsAttempted: 5,
          questionsCorrect: 4,
          durationMinutes: 3,
          timestamp: new Date().toISOString(),
          questionRecords: [{ questionId: 'sample-math-1', isCorrect: true } as any]
        },
        {
          id: 'sess-real-math',
          subject: 'math',
          grade: 8,
          unitName: '連立方程式',
          questionsAttempted: 10,
          questionsCorrect: 10,
          durationMinutes: 2,
          timestamp: new Date().toISOString(),
          questionRecords: [{ questionId: 'dyn-m8-123', isCorrect: true } as any]
        }
      ]
    };

    const sanitized = sanitizeReports([mixedTodayReport]);
    expect(sanitized.length).toBe(1);
    const today = sanitized[0];
    expect(today.date).toBe(todayStr);
    expect(today.sessions?.length).toBe(1);
    expect(today.sessions?.[0].id).toBe('sess-real-math');
    expect(today.questionsAttempted).toBe(10);
    expect(today.questionsCorrect).toBe(10);
    expect(today.subjectMinutes.math).toBeCloseTo(2, 1);
  });

  it('storage.getReports() 呼び出し時にローカルストレージ内のサンプルデータが自動パージされること', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySampleReport: DailyReport = {
      date: todayStr,
      questionsAttempted: 8,
      questionsCorrect: 7,
      subjectMinutes: { math: 3, japanese: 2, science: 0, social: 0, english: 0 },
      sessions: [
        {
          id: 'sess-s-math',
          subject: 'math',
          unitName: '九九・かけ算',
          questionsAttempted: 5,
          questionsCorrect: 4,
          durationMinutes: 3,
          timestamp: new Date().toISOString(),
          questionRecords: [{ questionId: 'sample-math-1', isCorrect: true } as any]
        }
      ]
    };

    localStorage.setItem(`kids_learnquest_reports_${profileId}`, JSON.stringify([todaySampleReport]));
    localStorage.setItem(`kids_learnquest_reports_backup_${profileId}`, JSON.stringify([todaySampleReport]));

    const reports = storage.getReports(profileId);
    expect(reports.length).toBe(0);

    // localStorage もサニタイズされたクリーンな状態になっていること
    const stored = JSON.parse(localStorage.getItem(`kids_learnquest_reports_${profileId}`) || '[]');
    expect(stored.length).toBe(0);
  });

  it('storage.resetTodayReport() で本日のレポートを明示的にリセットできること', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReport: DailyReport = {
      date: todayStr,
      questionsAttempted: 20,
      questionsCorrect: 18,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: []
    };

    localStorage.setItem(`kids_learnquest_reports_${profileId}`, JSON.stringify([todayReport]));

    storage.resetTodayReport(profileId);

    const reports = storage.getReports(profileId);
    expect(reports.find(r => r.date === todayStr)).toBeUndefined();
  });
});
