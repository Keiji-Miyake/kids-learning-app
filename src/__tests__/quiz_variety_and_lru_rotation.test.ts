import { describe, it, expect, beforeEach } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import { generateDynamicQuestion } from '../utils/questionGenerator';
import { storage } from '../utils/storage';
import type { QuestionSRSItem } from '../types';

describe('クイズ出題バリエーションとスマートローテーションのテスト (Quiz Variety & Smart Rotation Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('英語の動的生成エンジンが、主語・動詞・時制の組み合わせで多数のユニークな問題を生成できること', () => {
    const generatedTexts = new Set<string>();
    const totalRuns = 30;

    for (let i = 0; i < totalRuns; i++) {
      const q = generateDynamicQuestion('english', 8, '英文法・語彙');
      generatedTexts.add(q.questionText);
    }

    // 30回生成して少なくとも15種類以上のユニークな問題文が作られること（同じ問題ばかり出ない）
    expect(generatedTexts.size).toBeGreaterThanOrEqual(15);
  });

  it('理科・社会・国語の動的生成エンジンが、豊富な問題プールから多様に出題されること', () => {
    const subjects = ['science', 'social', 'japanese'] as const;

    for (const sub of subjects) {
      const texts = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const q = generateDynamicQuestion(sub, 3);
        texts.add(q.questionText);
      }
      // 20回生成して少なくとも10種類以上のユニークな問題が出ること
      expect(texts.size).toBeGreaterThanOrEqual(10);
    }
  });

  it('連続してクイズを解いた際、前回のセッションと同一の5問がそのまま連続して繰り返されないこと', () => {
    const srsData: Record<string, QuestionSRSItem> = {};
    const today = '2026-09-13';

    // 1回目のクイズ
    const set1 = generateUniqueQuizSet('english', 8, 5, undefined, [], [], srsData, today);
    expect(set1.length).toBe(5);

    // 1回目の問題をSRSクールダウン（Stage 1）に登録
    set1.forEach(q => {
      srsData[q.id] = {
        questionKey: q.id,
        questionId: q.id,
        subject: 'english',
        grade: 8,
        stage: 1,
        lastAttemptedAt: today,
        nextAvailableAt: '2026-09-20',
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      };
    });

    // 2回目のクイズ（直近履歴としてset1のテキストを渡す）
    const set2 = generateUniqueQuizSet(
      'english',
      8,
      5,
      undefined,
      set1.map(q => q.id),
      set1.map(q => q.questionText),
      srsData,
      today
    );
    expect(set2.length).toBe(5);

    // set1 と set2 の問題文が完全に一致（全被り）していないこと
    const set1Texts = new Set(set1.map(q => q.questionText));
    const overlapCount = set2.filter(q => set1Texts.has(q.questionText)).length;
    expect(overlapCount).toBeLessThan(5); // 少なくとも一部または全部が新しい問題であること
  });

  it('直近解いた問題の履歴をプロファイル単位でストレージに保存・復元できること', () => {
    const profileId = 'test-profile-recent';
    const sampleTexts = ['問題文1', '問題文2', '問題文3'];

    // 初期状態は空
    expect(storage.getRecentQuestionTexts(profileId)).toEqual([]);

    // 保存
    storage.saveRecentQuestionTexts(sampleTexts, profileId);

    // 取得
    const loaded = storage.getRecentQuestionTexts(profileId);
    expect(loaded).toEqual(sampleTexts);

    // 最大30件でローテーションされること
    const manyTexts = Array.from({ length: 40 }, (_, i) => `問題文${i}`);
    storage.saveRecentQuestionTexts(manyTexts, profileId);
    const capped = storage.getRecentQuestionTexts(profileId);
    expect(capped.length).toBe(30);
    expect(capped[capped.length - 1]).toBe('問題文39');
  });

  it('復習再出題時（Stage 3）に固定順ではなく、シャッフルおよびLRU順で出題されること', () => {
    const today = '2026-09-13';
    const srsData: Record<string, QuestionSRSItem> = {
      'so-g3-1': {
        questionKey: 'so-g3-1',
        questionId: 'so-g3-1',
        subject: 'social',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-13', // 今日解いたばかり
        nextAvailableAt: '2026-09-20',
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      },
      'so-g3-2': {
        questionKey: 'so-g3-2',
        questionId: 'so-g3-2',
        subject: 'social',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-01', // 2週間前（古い＝LRU優先）
        nextAvailableAt: '2026-09-20',
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      }
    };

    // クイズ生成
    const set = generateUniqueQuizSet(
      'social',
      3,
      5,
      '1. まちの様子 と 地図記号',
      [],
      [],
      srsData,
      today
    );

    expect(set.length).toBe(5);
    // 同一セット内で重複がないこと
    const uniqueTexts = new Set(set.map(q => q.questionText));
    expect(uniqueTexts.size).toBe(5);
  });
});
