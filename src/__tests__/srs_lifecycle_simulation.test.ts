import { describe, it, expect } from 'vitest';
import { generateUniqueQuizSet } from '../utils/quizSetGenerator';
import { evaluateSRSAnswer, getSRSStats, addDaysToDate } from '../utils/spacedRepetition';
import type { QuestionSRSItem } from '../types';

describe('🧠 忘却曲線・間隔反復（SRS）実生活シナリオ完全検証', () => {
  let srsData: Record<string, QuestionSRSItem> = {};
  const startDate = '2026-09-01';

  it('【シナリオ 1】Day 1 (2026-09-01): 初めてのクイズ挑戦 -> 全問正解で1週間後にセットされること', () => {
    const day1Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, startDate);
    expect(day1Quiz.length).toBe(5);

    // 5問すべて正解
    day1Quiz.forEach(q => {
      const result = evaluateSRSAnswer(q, srsData[q.id], true, startDate);
      srsData[q.id] = result;
      expect(result.stage).toBe(1);
      expect(result.intervalDays).toBe(7);
      expect(result.nextAvailableAt).toBe('2026-09-08'); // +7日
      expect(result.isMastered).toBe(false);
    });

    const stats = getSRSStats(srsData, startDate);
    expect(stats.inProgressCount).toBe(5);
    expect(stats.coolingDownCount).toBe(5);
    expect(stats.masteredCount).toBe(0);
    expect(stats.dueTodayCount).toBe(0);
  });

  it('【シナリオ 2】Day 2 〜 Day 7: 毎日同じ問題が1問たりとも出題されないこと（クールダウンの完全性）', () => {
    const day1Ids = Object.keys(srsData);

    for (let dayOffset = 1; dayOffset <= 6; dayOffset++) {
      const currentDate = addDaysToDate(startDate, dayOffset);
      const quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, currentDate);

      // Day 1で解いた問題が一切混入していないことを検証
      const overlap = quiz.filter(q => day1Ids.includes(q.id));
      expect(overlap.length).toBe(0);
    }
  });

  it('【シナリオ 3】Day 8 (2026-09-08): ちょうど1週間後に復習問題として復活・優先出題されること', () => {
    const day8Date = '2026-09-08';
    const day1Ids = Object.keys(srsData);

    const day8Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, day8Date);
    const reviewed = day8Quiz.filter(q => day1Ids.includes(q.id));
    expect(reviewed.length).toBeGreaterThan(0); // 復習問題が優先出題される

    // 1問目: 不正解
    const targetWrongQ = reviewed[0];
    const wrongResult = evaluateSRSAnswer(targetWrongQ, srsData[targetWrongQ.id], false, day8Date);
    srsData[targetWrongQ.id] = wrongResult;
    expect(wrongResult.nextAvailableAt).toBe('2026-09-09'); // 翌日に早期復習

    // 2問目以降: 正解 -> Stage 2（次は4週間後 = 28日後）
    const targetCorrectQ = reviewed[1];
    const correctResult = evaluateSRSAnswer(targetCorrectQ, srsData[targetCorrectQ.id], true, day8Date);
    srsData[targetCorrectQ.id] = correctResult;
    expect(correctResult.stage).toBe(2);
    expect(correctResult.intervalDays).toBe(28);
    expect(correctResult.nextAvailableAt).toBe('2026-10-06'); // +28日
  });

  it('【シナリオ 4】Day 9 (2026-09-09): 昨日間違えた問題が翌日に即座に再復習として出題されること', () => {
    const day9Date = '2026-09-09';
    const day9Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, day9Date);

    // 間違えた問題が翌日復活していること
    const wrongItem = Object.values(srsData).find(item => item.nextAvailableAt === '2026-09-09');
    expect(wrongItem).toBeDefined();
    expect(day9Quiz.some(q => q.id === wrongItem!.questionId)).toBe(true);
  });

  it('【シナリオ 5】Day 36 (2026-10-06): 4週間後（Stage 2 -> Stage 3）の復習期日に正しく復活すること', () => {
    const day36Date = '2026-10-06';
    const stage2Item = Object.values(srsData).find(item => item.stage === 2);
    expect(stage2Item).toBeDefined();

    // 4週間前の前日（2026-10-05）はまだクールダウン中で出題されない
    const day35Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, '2026-10-05');
    expect(day35Quiz.some(q => q.id === stage2Item!.questionId)).toBe(false);

    // 4週間後の当日（2026-10-06）に出題可能になる
    const day36Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, day36Date);
    expect(day36Quiz.some(q => q.id === stage2Item!.questionId)).toBe(true);

    // 正解すると Stage 3（次は1ヶ月後 = 30日後）へ昇格
    const dummyQ = day36Quiz.find(q => q.id === stage2Item!.questionId)!;
    const stage3Result = evaluateSRSAnswer(dummyQ, stage2Item, true, day36Date);
    srsData[dummyQ.id] = stage3Result;

    expect(stage3Result.stage).toBe(3);
    expect(stage3Result.intervalDays).toBe(30);
    expect(stage3Result.nextAvailableAt).toBe('2026-11-05'); // +30日
  });

  it('【シナリオ 6】Day 66 (2026-11-05): 1ヶ月後（Stage 3 -> Stage 4）に正解すると完全マスターになること', () => {
    const day66Date = '2026-11-05';
    const stage3Item = Object.values(srsData).find(item => item.stage === 3);
    expect(stage3Item).toBeDefined();

    // 1ヶ月後の当日（2026-11-05）に出題
    const day66Quiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, day66Date);
    expect(day66Quiz.some(q => q.id === stage3Item!.questionId)).toBe(true);

    // 正解して完全マスター（Stage 4 / isMastered === true）へ
    const targetMasterQ = day66Quiz.find(q => q.id === stage3Item!.questionId)!;
    const masteredResult = evaluateSRSAnswer(targetMasterQ, stage3Item, true, day66Date);
    srsData[targetMasterQ.id] = masteredResult;

    expect(masteredResult.stage).toBe(4);
    expect(masteredResult.isMastered).toBe(true);
  });

  it('【シナリオ 7】Day 67以降: 完全マスターした問題は、未来永劫ノルマ・クイズに100%出題されないこと', () => {
    const masteredItem = Object.values(srsData).find(item => item.isMastered);
    expect(masteredItem).toBeDefined();
    const masteredId = masteredItem!.questionId;

    const futureDates = ['2026-11-06', '2026-12-01', '2027-01-01', '2027-09-01'];
    for (const fDate of futureDates) {
      for (let trial = 0; trial < 10; trial++) {
        const futureQuiz = generateUniqueQuizSet('math', 3, 5, undefined, [], [], srsData, fDate);
        expect(futureQuiz.some(q => q.id === masteredId)).toBe(false);
      }
    }
  });
});
