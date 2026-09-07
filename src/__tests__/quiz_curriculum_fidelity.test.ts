import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import { curriculumLOD } from '../data/curriculumLOD';

describe('カリキュラム適合性および問題重複ゼロ検証テスト (Curriculum Fidelity & Zero Duplicates Test)', () => {
  it('全61単元において、5問クイズセット生成時に同一問題文の重複が0件であること', () => {
    for (const unit of curriculumLOD) {
      const questions = generateUniqueQuizSet(unit.subject as any, unit.grade, 5, unit.unitName);
      expect(questions.length).toBe(5);

      // 【第N問】のような水増し接尾辞を含めず、かつ文面が重複していないこと
      const texts = questions.map(q => q.questionText);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(5);

      // 接尾辞による水増しがないこと
      for (const text of texts) {
        expect(text).not.toMatch(/【第\d+問】$/);
      }
    }
  });

  it('全61単元において、10問単元テスト生成時にも同一問題文の重複が0件であること', () => {
    for (const unit of curriculumLOD) {
      const questions = generateUniqueQuizSet(unit.subject as any, unit.grade, 10, unit.unitName);
      expect(questions.length).toBe(10);

      const texts = questions.map(q => q.questionText);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(10);

      for (const text of texts) {
        expect(text).not.toMatch(/【第\d+問】$/);
      }
    }
  });

  it('小1算数「1. かずと たしざん(1)」で九九のかけ算が出題されず、小1向けの足し算・引き算が出題されること', () => {
    const questions = generateUniqueQuizSet('math', 1, 5, '1. かずと たしざん(1)');
    for (const q of questions) {
      expect(q.grade).toBe(1);
      expect(q.questionText).not.toContain('×');
      expect(q.questionText).not.toContain('九九');
    }
  });

  it('小1国語「1. ひらがな・かたかな」で中学生レベルの四字熟語が出題されず、小1向けの問題が出題されること', () => {
    const questions = generateUniqueQuizSet('japanese', 1, 5, '1. ひらがな・かたかな');
    for (const q of questions) {
      expect(q.grade).toBe(1);
      expect(q.questionText).not.toContain('油断大敵');
      expect(q.questionText).not.toContain('温故知新');
      expect(q.questionText).not.toContain('部首');
    }
  });

  it('小3理科「1. 身の回りの生物・昆虫」で地震P波や減数分裂が出題されず、小3向けの問題が出題されること', () => {
    const questions = generateUniqueQuizSet('science', 3, 5, '1. 身の回りの生物・昆虫');
    for (const q of questions) {
      expect(q.grade).toBe(3);
      expect(q.questionText).not.toContain('P波');
      expect(q.questionText).not.toContain('減数分裂');
      expect(q.questionText).not.toContain('オームの法則');
    }
  });

  it('小3社会「1. まちの様子 と 地図記号」で憲法や大化の改新が出題されず、小3向けの問題が出題されること', () => {
    const questions = generateUniqueQuizSet('social', 3, 5, '1. まちの様子 と 地図記号');
    for (const q of questions) {
      expect(q.grade).toBe(3);
      expect(q.questionText).not.toContain('日本国憲法');
      expect(q.questionText).not.toContain('大化の改新');
      expect(q.questionText).not.toContain('国民主権');
    }
  });

  it('中3数学「2. 平方根（√の計算）」で二次方程式の解の公式が誤爆混入しないこと', () => {
    const questions = generateUniqueQuizSet('math', 9, 10, '2. 平方根（√の計算）');
    for (const q of questions) {
      expect(q.questionText).not.toContain('解の公式');
      expect(q.questionText).not.toContain('二次方程式');
    }
  });

  it('除外リスト（excludeIds / excludeTexts）に渡した問題が次回の出題に含まれないこと', () => {
    const firstSet = generateUniqueQuizSet('math', 2, 5);
    const excludeIds = firstSet.map(q => q.id);
    const excludeTexts = firstSet.map(q => q.questionText);

    const secondSet = generateUniqueQuizSet('math', 2, 5, undefined, excludeIds, excludeTexts);
    for (const q of secondSet) {
      expect(excludeIds).not.toContain(q.id);
      expect(excludeTexts).not.toContain(q.questionText);
    }
  });
});
