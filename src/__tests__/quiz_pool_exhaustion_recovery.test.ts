import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import type { QuestionSRSItem } from '../types';

describe('クイズ問題プール枯渇対策テスト (Quiz Pool Exhaustion & Fallback Test)', () => {
  it('少ない問題数の単元で連続してクイズを解いても、常に要求数(5問)が返り、空配列にならないこと', () => {
    let recentIds: string[] = [];
    let recentTexts: string[] = [];
    const srsData: Record<string, QuestionSRSItem> = {};

    // 連続5回（計25問）同じ単元でクイズセットを生成
    for (let round = 1; round <= 5; round++) {
      const set = generateUniqueQuizSet(
        'social',
        3,
        5,
        '1. まちの様子 と 地図記号',
        recentIds,
        recentTexts,
        srsData
      );

      // 必ず5問返ってくること
      expect(set.length).toBe(5);

      // 同一クイズセット内では重複がないこと
      const uniqueTextsInSet = new Set(set.map(q => q.questionText));
      expect(uniqueTextsInSet.size).toBe(5);

      // 次回のために履歴を更新
      recentIds = [...recentIds.slice(-20), ...set.map(q => q.id)];
      recentTexts = [...recentTexts.slice(-20), ...set.map(q => q.questionText)];
    }
  });

  it('直前履歴(excludeTexts/excludeIds)で全問が除外対象になっても、枯渇時には安全に緩和されて5問取得できること', () => {
    // 英語の中3など、問題数が限られるケースを想定
    const set1 = generateUniqueQuizSet('english', 9, 5, '1. 現在完了（継続・経験・完了）');
    expect(set1.length).toBe(5);

    // set1の全問を除外対象として指定
    const excludeIds = set1.map(q => q.id);
    const excludeTexts = set1.map(q => q.questionText);

    // 再度同じ条件で取得を試みる
    const set2 = generateUniqueQuizSet(
      'english',
      9,
      5,
      '1. 現在完了（継続・経験・完了）',
      excludeIds,
      excludeTexts
    );

    // 枯渇せず必ず5問返ってくること
    expect(set2.length).toBe(5);

    // 同一セット内での重複はないこと
    const uniqueTexts = new Set(set2.map(q => q.questionText));
    expect(uniqueTexts.size).toBe(5);
  });

  it('全問題がSRSクールダウン中またはマスター済みの場合でも、0問にならず復習・練習問題として出題されること', () => {
    const today = '2026-09-13';

    // 該当教科・学年の固定問題すべてをマスター済みにする
    const srsData: Record<string, QuestionSRSItem> = {};
    const initialSet = generateUniqueQuizSet('social', 3, 5, '1. まちの様子 と 地図記号');

    initialSet.forEach((q) => {
      srsData[q.id] = {
        questionKey: q.id,
        questionId: q.id,
        subject: 'social',
        grade: 3,
        stage: 4,
        lastAttemptedAt: today,
        nextAvailableAt: '9999-12-31', // 完全マスター
        intervalDays: 9999,
        isMastered: true,
        correctStreak: 5,
        totalAttempts: 5,
        totalCorrect: 5
      };
    });

    const fallbackSet = generateUniqueQuizSet(
      'social',
      3,
      5,
      '1. まちの様子 と 地図記号',
      initialSet.map(q => q.id),
      initialSet.map(q => q.questionText),
      srsData,
      today
    );

    // 0問にならず必ず5問取得できること
    expect(fallbackSet.length).toBe(5);
    const uniqueTexts = new Set(fallbackSet.map(q => q.questionText));
    expect(uniqueTexts.size).toBe(5);
  });

  it('単元テスト(10問)モードでも、問題プールが少ない単元で確実に10問取得できること', () => {
    const examSet = generateUniqueQuizSet(
      'japanese',
      1,
      10,
      '1. ひらがな・かたかな'
    );

    expect(examSet.length).toBe(10);
    const uniqueTexts = new Set(examSet.map(q => q.questionText));
    expect(uniqueTexts.size).toBe(10);
  });
});
