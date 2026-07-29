import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import type { Subject } from '../types';

describe('クイズ1回内での問題文一意性テスト (Quiz Session Question Uniqueness Test)', () => {
  it('5問のクイズセットを生成した際、問題文(questionText)がすべてユニークであること', () => {
    const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];

    for (let i = 0; i < 100; i++) {
      const subject = subjects[i % subjects.length];
      const questions = generateUniqueQuizSet(subject, 3, 5, '一次関数');

      expect(questions.length).toBe(5);
      const questionTexts = questions.map(q => q.questionText);
      const uniqueTexts = new Set(questionTexts);
      expect(uniqueTexts.size).toBe(5);
    }
  });

  it('10問の確認テストセットを生成した際、問題文(questionText)がすべてユニークであること', () => {
    const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];

    for (let i = 0; i < 100; i++) {
      const subject = subjects[i % subjects.length];
      const questions = generateUniqueQuizSet(subject, 7, 10);

      expect(questions.length).toBe(10);
      const questionTexts = questions.map(q => q.questionText);
      const uniqueTexts = new Set(questionTexts);
      expect(uniqueTexts.size).toBe(10);
    }
  });
});
