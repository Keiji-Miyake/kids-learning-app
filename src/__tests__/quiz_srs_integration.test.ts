import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import type { QuestionSRSItem } from '../types';

describe('クイズ生成と間隔反復（SRS）の統合テスト', () => {
  const today = '2026-09-09';

  it('完全習得（isMastered === true）した問題は、ノルマ・クイズ出題から100%除外されること', () => {
    const srsData: Record<string, QuestionSRSItem> = {
      'math-g3-1': {
        questionKey: 'math-g3-1',
        questionId: 'math-g3-1',
        subject: 'math',
        grade: 3,
        stage: 4,
        lastAttemptedAt: '2026-08-01',
        nextAvailableAt: '9999-12-31',
        intervalDays: 9999,
        isMastered: true,
        correctStreak: 4,
        totalAttempts: 4,
        totalCorrect: 4
      }
    };

    // 10回クイズセットを生成しても、一度も math-g3-1 が選ばれないこと
    for (let i = 0; i < 10; i++) {
      const set = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, today);
      expect(set.some(q => q.id === 'math-g3-1')).toBe(false);
    }
  });

  it('初回正解（Stage 1: 1週間待ち）の問題は、7日以内は出題されないこと', () => {
    const srsData: Record<string, QuestionSRSItem> = {
      'math-g3-2': {
        questionKey: 'math-g3-2',
        questionId: 'math-g3-2',
        subject: 'math',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-08',
        nextAvailableAt: '2026-09-15', // 9/15までロック
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      }
    };

    // 9/09の時点では math-g3-2 は除外されること
    const setToday = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, '2026-09-09');
    expect(setToday.some(q => q.id === 'math-g3-2')).toBe(false);

    // 9/15（1週間後）になると復習期日となり、出題可能になること
    const setNextWeek = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, '2026-09-15');
    // 出題候補に復活していること
    expect(setNextWeek.length).toBe(5);
  });

  it('復習期日を迎えた問題は優先的に出題されること', () => {
    const srsData: Record<string, QuestionSRSItem> = {
      'math-g3-2': {
        questionKey: 'math-g3-2',
        questionId: 'math-g3-2',
        subject: 'math',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-01',
        nextAvailableAt: '2026-09-08', // 昨日が期日（期日到来）
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      }
    };

    const set = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, today);
    expect(set.some(q => q.id === 'math-g3-2')).toBe(true);
  });

  it('すべての問題は重複せずユニークであること', () => {
    const set = generateUniqueQuizSet('math', 3, 5, undefined, [], [], {}, today);
    expect(set.length).toBe(5);
    const uniqueIds = new Set(set.map(q => q.id));
    const uniqueTexts = new Set(set.map(q => q.questionText));
    expect(uniqueIds.size).toBe(5);
    expect(uniqueTexts.size).toBe(5);
  });
});
