import { describe, it, expect } from 'vitest';
import { generateDynamicQuestion } from '../utils/questionGenerator';
import { questions } from '../data/questions';
import type { Subject } from '../types';

describe('選択肢重複防止テスト (Unique Options Test)', () => {
  it('固定問題 (questions.ts) のすべての問題で選択肢に重複がないこと', () => {
    questions.forEach((q) => {
      expect(q.options.length).toBe(4);
      const uniqueOptions = new Set(q.options);
      expect(uniqueOptions.size).toBe(4);
    });
  });

  it('動的生成問題 (generateDynamicQuestion) を大量生成しても選択肢がすべてユニークであること', () => {
    const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];
    const unitNames = ['一次関数', '連立方程式', 'y=ax²', '相似', '三平方', '因数分解', '平方根', '二次方程式', 'オーム', '時差', '関係代名詞', '現在完了', '温故知新'];

    for (let i = 0; i < 500; i++) {
      const subject = subjects[i % subjects.length];
      const grade = (i % 9) + 1;
      const unitName = unitNames[i % unitNames.length];

      const q = generateDynamicQuestion(subject, grade, unitName);
      expect(q.options.length).toBe(4);
      const uniqueOptions = new Set(q.options);
      if (uniqueOptions.size < 4) {
        console.error(`重複が発見された問題 (${q.id}):`, q.questionText, q.options);
      }
      expect(uniqueOptions.size).toBe(4);
    }
  });
});
