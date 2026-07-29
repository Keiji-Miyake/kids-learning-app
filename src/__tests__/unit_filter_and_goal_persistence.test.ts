import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import { storage } from '../utils/storage';
import type { DailyGoal } from '../types';

describe('単元フィルター出題およびノルマ数値永続化テスト (Unit Filtering & Daily Goal Persistence Test)', () => {
  it('単元名("一次関数")を指定してクイズセットを生成した際、選択された問題が単元に沿ったものであること', () => {
    const questions = generateUniqueQuizSet('math', 8, 5, '一次関数');
    expect(questions.length).toBe(5);

    // 一次関数に関するキーワードが含まれているか検証
    const hasUnitMatch = questions.some(q => 
      q.questionText.includes('一次関数') || 
      q.questionText.includes('y =') || 
      q.explanation.includes('一次関数') ||
      q.explanation.includes('傾き')
    );
    expect(hasUnitMatch).toBe(true);
  });

  it('1日の目標解答数を10問に設定した際、同期後も10問の設定が維持されること', () => {
    const profile = storage.getActiveProfile();
    const customGoal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 20,
      rewardText: 'お小遣い100円！',
      goalType: 'total_count'
    };

    const updatedProfile = {
      ...profile,
      dailyGoal: customGoal
    };

    storage.updateProfile(updatedProfile);

    const reloaded = storage.getActiveProfile();
    expect(reloaded.dailyGoal?.targetQuestions).toBe(10);
  });
});
