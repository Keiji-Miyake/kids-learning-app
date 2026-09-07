import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';

describe('Quiz Session Report Storage Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records QuizSession in DailyReport.sessions and updates subjectMinutes & subjectBreakdown', () => {
    const profileId = 'test-profile-1';
    // 5問中5問正解、120秒 (2分)
    storage.addReportData('math', 5, 120, profileId, 5);

    const reports = storage.getReports(profileId);
    expect(reports.length).toBe(1);
    const today = reports[0];
    expect(today.questionsAttempted).toBe(5);
    expect(today.questionsCorrect).toBe(5);
    expect(today.subjectMinutes.math).toBeCloseTo(2, 1);
    expect(today.sessions).toBeDefined();
    expect(today.sessions?.length).toBe(1);
    expect(today.sessions?.[0].subject).toBe('math');
    expect(today.sessions?.[0].durationMinutes).toBeCloseTo(2, 1);
    expect(today.subjectBreakdown?.math?.total).toBe(5);
  });

  it('supports legacy boolean calls for addReportData', () => {
    const profileId = 'test-profile-2';
    // 旧形式: correct = true, 60秒
    storage.addReportData('japanese', true, 60, profileId);

    const reports = storage.getReports(profileId);
    expect(reports.length).toBe(1);
    const today = reports[0];
    expect(today.questionsAttempted).toBe(1);
    expect(today.questionsCorrect).toBe(1);
    expect(today.subjectMinutes.japanese).toBeCloseTo(1, 1);
    expect(today.sessions?.length).toBe(1);
    expect(today.subjectBreakdown?.japanese?.total).toBe(1);
  });
});
