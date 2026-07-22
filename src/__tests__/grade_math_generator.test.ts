import { describe, it, expect } from 'vitest';
import { generateDynamicQuestion } from '../utils/questionGenerator';

describe('Grade 9 Math Dynamic Question Generator', () => {
  it('should generate grade-appropriate questions for grade 9 math units', () => {
    const grade9Units = [
      '1. 多項式の展開と因数分解',
      '2. 平方根（√の計算）',
      '3. 二次方程式（解の公式）',
      '4. 関数 y=ax²',
      '5. 相似な図形・円周角の定理',
      '6. 三平方の定理（a²+b²=c²）',
      '未指定または不明な単元'
    ];

    grade9Units.forEach(unitName => {
      const q = generateDynamicQuestion('math', 9, unitName);
      expect(q.grade).toBe(9);
      // 小学校の九九計算「計算問題： 「X × Y」 の答えはどれかな？」が含まれないこと
      expect(q.questionText).not.toContain('計算問題： 「');
    });
  });
});
