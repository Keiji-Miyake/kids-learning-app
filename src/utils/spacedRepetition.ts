import type { Question, QuestionSRSItem, SRSStats } from '../types';

// 🧠 各ステージの復習間隔（日数）
// Stage 1: 1週間後 (7日)
// Stage 2: 4週間後 (28日)
// Stage 3: 1ヶ月後 (30日)
// Stage 4: 完全習得 (Mastered)
export const SRS_INTERVAL_DAYS: Record<number, number> = {
  1: 7,
  2: 28,
  3: 30
};

// 日付に日数を加算して YYYY-MM-DD 文字列を返すヘルパー
export const addDaysToDate = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// 今日の日付文字列 (YYYY-MM-DD) を取得
export const getTodayDateString = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 問題の一意キー生成（固定問題はID、動的問題は正規化テキストやベースID）
export const generateQuestionKey = (question: Question): string => {
  if (question.id && !question.id.startsWith('dyn-')) {
    return question.id;
  }
  // 動的問題の場合は教科・学年・問題文の正規化で同一問題を識別
  const cleanText = question.questionText
    .replace(/[「」『』\s]/g, '')
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  return `${question.subject}-g${question.grade}-${cleanText}`;
};

// 解答結果に応じたSRSステージの更新判定
export const evaluateSRSAnswer = (
  question: Question,
  currentItem: QuestionSRSItem | null | undefined,
  isCorrect: boolean,
  nowStr?: string
): QuestionSRSItem => {
  const today = nowStr || getTodayDateString();
  const questionKey = currentItem?.questionKey || generateQuestionKey(question);

  const prevAttempts = currentItem?.totalAttempts || 0;
  const prevCorrect = currentItem?.totalCorrect || 0;
  const prevStreak = currentItem?.correctStreak || 0;
  const currentStage = currentItem?.stage || 0;

  if (isCorrect) {
    const newStreak = prevStreak + 1;
    let nextStage = currentStage + 1;
    let isMastered = false;
    let interval = 7;

    if (nextStage >= 4) {
      nextStage = 4;
      isMastered = true;
      interval = 9999;
    } else {
      interval = SRS_INTERVAL_DAYS[nextStage] || 7;
    }

    return {
      questionKey,
      questionId: question.id,
      subject: question.subject,
      grade: question.grade,
      stage: nextStage,
      lastAttemptedAt: today,
      nextAvailableAt: isMastered ? '9999-12-31' : addDaysToDate(today, interval),
      intervalDays: interval,
      isMastered,
      correctStreak: newStreak,
      totalAttempts: prevAttempts + 1,
      totalCorrect: prevCorrect + 1
    };
  } else {
    // 不正解の場合: 記憶が定着していないため、直前ステージへ降格または再学習（Stage 1へ）
    // 翌日に再出題して早期復習
    const fallbackStage = Math.max(1, currentStage - 1);
    return {
      questionKey,
      questionId: question.id,
      subject: question.subject,
      grade: question.grade,
      stage: fallbackStage,
      lastAttemptedAt: today,
      nextAvailableAt: addDaysToDate(today, 1), // 翌日に再復習
      intervalDays: 1,
      isMastered: false,
      correctStreak: 0,
      totalAttempts: prevAttempts + 1,
      totalCorrect: prevCorrect
    };
  }
};

// 毎日の通常・ノルマクイズに出題可能かどうかの判定
export const isQuestionAvailableForDailyQuiz = (
  item: QuestionSRSItem | null | undefined,
  todayStr?: string
): boolean => {
  // まだ一度も解いたことがない新規問題
  if (!item) return true;

  // 完全習得（Mastered）した問題は、もうノルマには表示しない
  if (item.isMastered) return false;

  const today = todayStr || getTodayDateString();

  // 次回出題可能日（期日）が今日以前であれば出題可能（復習タイミング到来）
  return item.nextAvailableAt <= today;
};

// SRS全体の進捗統計を集計
export const getSRSStats = (
  srsMap: Record<string, QuestionSRSItem>,
  todayStr?: string
): SRSStats => {
  const today = todayStr || getTodayDateString();
  let masteredCount = 0;
  let inProgressCount = 0;
  let dueTodayCount = 0;
  let coolingDownCount = 0;
  const stageBreakdown: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0
  };

  Object.values(srsMap).forEach(item => {
    if (item.isMastered) {
      masteredCount++;
      stageBreakdown[4] = (stageBreakdown[4] || 0) + 1;
    } else {
      inProgressCount++;
      stageBreakdown[item.stage] = (stageBreakdown[item.stage] || 0) + 1;

      if (item.nextAvailableAt <= today) {
        dueTodayCount++;
      } else {
        coolingDownCount++;
      }
    }
  });

  return {
    masteredCount,
    inProgressCount,
    dueTodayCount,
    coolingDownCount,
    stageBreakdown
  };
};
