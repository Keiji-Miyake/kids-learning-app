import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { SessionQuestionRecord } from '../types';

describe('学習レポート詳細保存テスト (Learning History Storage Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addReportData に sessionDetails を渡した際、単元名や問題履歴が QuizSession に保存されること', () => {
    const profile = storage.getActiveProfile();
    const records: SessionQuestionRecord[] = [
      {
        questionId: 'q-1',
        questionText: '1000を10こあつめた数は？',
        selectedAnswer: '10000',
        correctAnswer: '10000',
        isCorrect: true,
        explanation: '1000が10個で10000です。'
      }
    ];

    storage.addReportData('math', 1, 65, profile.id, 1, {
      unitName: '大きな数',
      sessionType: 'quiz',
      questionRecords: records
    });

    const reports = storage.getReports(profile.id);
    expect(reports.length).toBeGreaterThan(0);
    const todayReport = reports[0];
    expect(todayReport.sessions?.length).toBeGreaterThan(0);

    const lastSession = todayReport.sessions?.[todayReport.sessions.length - 1];
    expect(lastSession?.unitName).toBe('大きな数');
    expect(lastSession?.sessionType).toBe('quiz');
    expect(lastSession?.durationSeconds).toBe(65);
    expect(lastSession?.questionRecords?.length).toBe(1);
    expect(lastSession?.questionRecords?.[0].questionText).toBe('1000を10こあつめた数は？');
    expect(lastSession?.questionRecords?.[0].selectedAnswer).toBe('10000');
  });

  it('sessionDetails なしで呼び出しても既存互換で安全にデフォルト値が補完されること', () => {
    const profile = storage.getActiveProfile();
    storage.addReportData('japanese', 1, 120, profile.id, 1);

    const reports = storage.getReports(profile.id);
    const lastSession = reports[0].sessions?.[reports[0].sessions.length - 1];
    expect(lastSession?.unitName).toBe('全般（ランダム）');
    expect(lastSession?.sessionType).toBe('quiz');
    expect(lastSession?.durationSeconds).toBe(120);
    expect(lastSession?.questionRecords).toEqual([]);
  });
});
