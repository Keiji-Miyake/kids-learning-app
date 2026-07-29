import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';

describe('単元別問題厳密一致テスト (Strict Unit Matching Test)', () => {
  it('「平方根」を選択した際、相似などの別単元の問題が含まれず、全問題が平方根関連であること', () => {
    for (let i = 0; i < 50; i++) {
      const questions = generateUniqueQuizSet('math', 9, 5, '平方根');
      expect(questions.length).toBe(5);

      questions.forEach(q => {
        // 相似の問題が混入していないこと
        expect(q.questionText.includes('相似')).toBe(false);
        expect(q.explanation.includes('相似')).toBe(false);

        // 平方根に関連するキーワードまたは√が含まれていること
        const isSqrtRelated = 
          q.questionText.includes('√') || 
          q.questionText.includes('平方根') || 
          q.explanation.includes('√') ||
          q.explanation.includes('平方根');

        expect(isSqrtRelated).toBe(true);
      });
    }
  });
});
