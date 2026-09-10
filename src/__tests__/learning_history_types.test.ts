import { describe, it, expect } from 'vitest';
import type { QuizSession, SessionQuestionRecord } from '../types';

describe('学習履歴詳細の型定義テスト (Learning History Types Test)', () => {
  it('SessionQuestionRecord および拡張 QuizSession が正しく定義されていること', () => {
    const record: SessionQuestionRecord = {
      questionId: 'q-math-1',
      questionText: '1000を10こあつめた数は？',
      selectedAnswer: '10000',
      correctAnswer: '10000',
      isCorrect: true,
      explanation: '1000が10個で10000です。'
    };

    const session: QuizSession = {
      id: 'sess-1',
      subject: 'math',
      unitName: '大きな数',
      sessionType: 'quiz',
      questionsAttempted: 1,
      questionsCorrect: 1,
      durationMinutes: 1,
      durationSeconds: 65,
      timestamp: '2026-09-11T10:00:00.000Z',
      questionRecords: [record]
    };

    expect(session.unitName).toBe('大きな数');
    expect(session.sessionType).toBe('quiz');
    expect(session.durationSeconds).toBe(65);
    expect(session.questionRecords?.[0].selectedAnswer).toBe('10000');
    expect(session.questionRecords?.[0].isCorrect).toBe(true);
    expect(session.questionRecords?.[0].explanation).toBe('1000が10個で10000です。');
  });
});
