import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { Question } from '../types';

describe('クイズおよび単元確認テストの解答トラッキング統合テスト (Quiz & Exam Tracking Integration Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('クイズセッション終了時に解答・正解・解説が正しく記録されること', () => {
    const profile = storage.getActiveProfile();
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        subject: 'math',
        grade: 3,
        questionText: '1000を10こあつめた数は？',
        options: ['1000', '10000', '100000'],
        correctAnswer: '10000',
        explanation: '1000が10個で10000です。'
      },
      {
        id: 'q2',
        subject: 'math',
        grade: 3,
        questionText: '1億は1000万の何倍？',
        options: ['10倍', '100倍', '1000倍'],
        correctAnswer: '10倍',
        explanation: '1000万を10倍すると1億になります。'
      }
    ];

    const records = [
      {
        questionId: mockQuestions[0].id,
        questionText: mockQuestions[0].questionText,
        selectedAnswer: '10000',
        correctAnswer: mockQuestions[0].correctAnswer,
        isCorrect: true,
        explanation: mockQuestions[0].explanation
      },
      {
        questionId: mockQuestions[1].id,
        questionText: mockQuestions[1].questionText,
        selectedAnswer: '100倍',
        correctAnswer: mockQuestions[1].correctAnswer,
        isCorrect: false,
        explanation: mockQuestions[1].explanation
      }
    ];

    storage.addReportData('math', 1, 45, profile.id, 2, {
      unitName: '大きな数',
      sessionType: 'quiz',
      questionRecords: records
    });

    const report = storage.getReports(profile.id)[0];
    expect(report.sessions?.length).toBe(1);
    const session = report.sessions?.[0];
    expect(session?.unitName).toBe('大きな数');
    expect(session?.sessionType).toBe('quiz');
    expect(session?.questionRecords?.length).toBe(2);
    expect(session?.questionRecords?.[0].isCorrect).toBe(true);
    expect(session?.questionRecords?.[1].isCorrect).toBe(false);
    expect(session?.questionRecords?.[1].selectedAnswer).toBe('100倍');
    expect(session?.questionRecords?.[1].correctAnswer).toBe('10倍');
  });

  it('単元確認テストの提出時に sessionType: "exam" として記録されること', () => {
    const profile = storage.getActiveProfile();
    const records = [
      {
        questionId: 'exam-q1',
        questionText: '九九の7の段で7×6は？',
        selectedAnswer: '42',
        correctAnswer: '42',
        isCorrect: true,
        explanation: '7×6=42です。'
      }
    ];

    storage.addReportData('math', 1, 180, profile.id, 1, {
      unitName: 'かけ算九九',
      sessionType: 'exam',
      questionRecords: records
    });

    const report = storage.getReports(profile.id)[0];
    const examSession = report.sessions?.[0];
    expect(examSession?.sessionType).toBe('exam');
    expect(examSession?.unitName).toBe('かけ算九九');
    expect(examSession?.durationSeconds).toBe(180);
    expect(examSession?.questionRecords?.[0].questionId).toBe('exam-q1');
  });
});
