import { describe, it, expect } from 'vitest';
import {
  evaluateSRSAnswer,
  isQuestionAvailableForDailyQuiz,
  getSRSStats,
  generateQuestionKey,
  SRS_INTERVAL_DAYS
} from '../utils/spacedRepetition';
import type { QuestionSRSItem, Question } from '../types';

describe('間隔反復記憶法 (Spaced Repetition System) テスト', () => {
  const baseDate = '2026-09-09';

  const dummyQuestion: Question = {
    id: 'math-g3-1',
    subject: 'math',
    grade: 3,
    questionText: 'この円の中で、色がついている部分は全体のどれだけかな？（分数）',
    options: ['1/2', '1/3', '1/4', '3/4'],
    correctAnswer: '3/4',
    explanation: '4つに分けたうちの3つ分です。'
  };

  it('問題キーの生成: 固定問題はIDを、動的問題は正規化テキスト等を用いて一意に特定できること', () => {
    const fixedKey = generateQuestionKey(dummyQuestion);
    expect(fixedKey).toBe('math-g3-1');

    const dynQuestion: Question = {
      id: 'dyn-m1-add-12345',
      subject: 'math',
      grade: 1,
      questionText: 'たしざんの もんだい：「5 ＋ 3」の こたえは どれかな？',
      options: ['8', '9', '7', '10'],
      correctAnswer: '8',
      explanation: '5 + 3 = 8 です。'
    };
    const dynKey = generateQuestionKey(dynQuestion);
    expect(dynKey).toBeDefined();
    expect(dynKey.length).toBeGreaterThan(0);
  });

  it('初回正解 (Stage 0 -> Stage 1): 1週間後 (7日後) まで出題できなくなること', () => {
    const result = evaluateSRSAnswer(dummyQuestion, null, true, baseDate);

    expect(result.stage).toBe(1);
    expect(result.intervalDays).toBe(SRS_INTERVAL_DAYS[1]); // 7
    expect(result.lastAttemptedAt).toBe('2026-09-09');
    expect(result.nextAvailableAt).toBe('2026-09-16'); // +7日
    expect(result.isMastered).toBe(false);
    expect(result.correctStreak).toBe(1);

    // 今日（2026-09-09）や3日後（2026-09-12）は出題不可（クールダウン中）
    expect(isQuestionAvailableForDailyQuiz(result, '2026-09-09')).toBe(false);
    expect(isQuestionAvailableForDailyQuiz(result, '2026-09-12')).toBe(false);

    // 1週間後（2026-09-16）以降は出題可能
    expect(isQuestionAvailableForDailyQuiz(result, '2026-09-16')).toBe(true);
    expect(isQuestionAvailableForDailyQuiz(result, '2026-09-17')).toBe(true);
  });

  it('1週間後の復習で正解 (Stage 1 -> Stage 2): 4週間後 (28日後) まで出題できなくなること', () => {
    const stage1Item: QuestionSRSItem = {
      questionKey: 'math-g3-1',
      questionId: 'math-g3-1',
      subject: 'math',
      grade: 3,
      stage: 1,
      lastAttemptedAt: '2026-09-09',
      nextAvailableAt: '2026-09-16',
      intervalDays: 7,
      isMastered: false,
      correctStreak: 1,
      totalAttempts: 1,
      totalCorrect: 1
    };

    const reviewDate = '2026-09-16';
    const result = evaluateSRSAnswer(dummyQuestion, stage1Item, true, reviewDate);

    expect(result.stage).toBe(2);
    expect(result.intervalDays).toBe(SRS_INTERVAL_DAYS[2]); // 28
    expect(result.lastAttemptedAt).toBe('2026-09-16');
    expect(result.nextAvailableAt).toBe('2026-10-14'); // +28日
    expect(result.isMastered).toBe(false);
    expect(result.correctStreak).toBe(2);

    // 4週間以内は出題不可
    expect(isQuestionAvailableForDailyQuiz(result, '2026-09-20')).toBe(false);
    expect(isQuestionAvailableForDailyQuiz(result, '2026-10-13')).toBe(false);
    // 4週間後以降は出題可能
    expect(isQuestionAvailableForDailyQuiz(result, '2026-10-14')).toBe(true);
  });

  it('4週間後の復習で正解 (Stage 2 -> Stage 3): 1ヶ月後 (30日後) まで出題できなくなること', () => {
    const stage2Item: QuestionSRSItem = {
      questionKey: 'math-g3-1',
      questionId: 'math-g3-1',
      subject: 'math',
      grade: 3,
      stage: 2,
      lastAttemptedAt: '2026-09-16',
      nextAvailableAt: '2026-10-14',
      intervalDays: 28,
      isMastered: false,
      correctStreak: 2,
      totalAttempts: 2,
      totalCorrect: 2
    };

    const reviewDate = '2026-10-14';
    const result = evaluateSRSAnswer(dummyQuestion, stage2Item, true, reviewDate);

    expect(result.stage).toBe(3);
    expect(result.intervalDays).toBe(SRS_INTERVAL_DAYS[3]); // 30
    expect(result.lastAttemptedAt).toBe('2026-10-14');
    expect(result.nextAvailableAt).toBe('2026-11-13'); // +30日
    expect(result.isMastered).toBe(false);
    expect(result.correctStreak).toBe(3);

    // 1ヶ月以内は出題不可
    expect(isQuestionAvailableForDailyQuiz(result, '2026-11-01')).toBe(false);
    // 1ヶ月後以降は出題可能
    expect(isQuestionAvailableForDailyQuiz(result, '2026-11-13')).toBe(true);
  });

  it('1ヶ月後の復習で正解 (Stage 3 -> Stage 4 / Mastered): 完全習得となり、以降ノルマには表示されないこと', () => {
    const stage3Item: QuestionSRSItem = {
      questionKey: 'math-g3-1',
      questionId: 'math-g3-1',
      subject: 'math',
      grade: 3,
      stage: 3,
      lastAttemptedAt: '2026-10-14',
      nextAvailableAt: '2026-11-13',
      intervalDays: 30,
      isMastered: false,
      correctStreak: 3,
      totalAttempts: 3,
      totalCorrect: 3
    };

    const reviewDate = '2026-11-13';
    const result = evaluateSRSAnswer(dummyQuestion, stage3Item, true, reviewDate);

    expect(result.stage).toBe(4);
    expect(result.isMastered).toBe(true);
    expect(result.correctStreak).toBe(4);

    // 完全習得後は、どれだけ未来の日付であってもノルマには出題されない
    expect(isQuestionAvailableForDailyQuiz(result, '2026-11-13')).toBe(false);
    expect(isQuestionAvailableForDailyQuiz(result, '2026-12-01')).toBe(false);
    expect(isQuestionAvailableForDailyQuiz(result, '2027-01-01')).toBe(false);
  });

  it('復習時に不正解だった場合: Stageが降格し、翌日に再復習できるようになること', () => {
    const stage2Item: QuestionSRSItem = {
      questionKey: 'math-g3-1',
      questionId: 'math-g3-1',
      subject: 'math',
      grade: 3,
      stage: 2,
      lastAttemptedAt: '2026-09-16',
      nextAvailableAt: '2026-10-14',
      intervalDays: 28,
      isMastered: false,
      correctStreak: 2,
      totalAttempts: 2,
      totalCorrect: 2
    };

    const reviewDate = '2026-10-14';
    const result = evaluateSRSAnswer(dummyQuestion, stage2Item, false, reviewDate);

    // 不正解時は記憶があやふやなのでStage 1に降格、連勝ストリークは0、次回は翌日
    expect(result.stage).toBe(1);
    expect(result.correctStreak).toBe(0);
    expect(result.nextAvailableAt).toBe('2026-10-15'); // 翌日
    expect(result.isMastered).toBe(false);

    // 当日は出題不可だが、翌日以降は出題可能
    expect(isQuestionAvailableForDailyQuiz(result, '2026-10-14')).toBe(false);
    expect(isQuestionAvailableForDailyQuiz(result, '2026-10-15')).toBe(true);
  });

  it('未着手問題（SRS記録なし）: クイズ出題可能であること', () => {
    expect(isQuestionAvailableForDailyQuiz(undefined, '2026-09-09')).toBe(true);
  });

  it('SRS統計 (getSRSStats) の集計が正確であること', () => {
    const srsMap: Record<string, QuestionSRSItem> = {
      'q1': {
        questionKey: 'q1',
        questionId: 'q1',
        subject: 'math',
        grade: 3,
        stage: 4,
        lastAttemptedAt: '2026-09-01',
        nextAvailableAt: '2026-10-01',
        intervalDays: 30,
        isMastered: true,
        correctStreak: 4,
        totalAttempts: 4,
        totalCorrect: 4
      },
      'q2': {
        questionKey: 'q2',
        questionId: 'q2',
        subject: 'math',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-02',
        nextAvailableAt: '2026-09-09', // 今日が期日
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      },
      'q3': {
        questionKey: 'q3',
        questionId: 'q3',
        subject: 'math',
        grade: 3,
        stage: 2,
        lastAttemptedAt: '2026-09-05',
        nextAvailableAt: '2026-10-03', // クールダウン中
        intervalDays: 28,
        isMastered: false,
        correctStreak: 2,
        totalAttempts: 2,
        totalCorrect: 2
      }
    };

    const stats = getSRSStats(srsMap, '2026-09-09');
    expect(stats.masteredCount).toBe(1);
    expect(stats.inProgressCount).toBe(2);
    expect(stats.dueTodayCount).toBe(1); // q2
    expect(stats.coolingDownCount).toBe(1); // q3
    expect(stats.stageBreakdown[4]).toBe(1);
    expect(stats.stageBreakdown[1]).toBe(1);
    expect(stats.stageBreakdown[2]).toBe(1);
  });
});
