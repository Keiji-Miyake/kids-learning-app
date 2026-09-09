import type { Question, Subject, QuestionSRSItem } from '../types';
import { generateDynamicQuestion } from './questionGenerator';
import { questions as fixedQuestions } from '../data/questions';
import { generateQuestionKey, isQuestionAvailableForDailyQuiz, getTodayDateString } from './spacedRepetition';

export const generateUniqueQuizSet = (
  subject: Subject,
  grade: number,
  count: number = 5,
  unitName?: string,
  excludeIds: string[] = [],
  excludeTexts: string[] = [],
  srsData?: Record<string, QuestionSRSItem>,
  todayStr?: string
): Question[] => {
  const resultSet: Question[] = [];
  const usedTexts = new Set<string>(excludeTexts);
  const today = todayStr || getTodayDateString();

  const isStrictUnitMode = !!(unitName && unitName !== 'all');

  // 単元一致判定キーワードの作成
  const getUnitKeywords = (u: string): string[] => {
    // 先頭の番号（"1. ", "2. " 等）を除去
    const clean = u.replace(/^\d+\.\s*/, '').trim();

    if (clean.includes('平方根')) return ['平方根', '√'];
    if (clean.includes('因数分解') || clean.includes('多項式') || clean.includes('展開')) return ['因数分解', '多項式', '展開'];
    if (clean.includes('二次方程式')) return ['二次方程式'];
    if (clean.includes('相似')) return ['相似'];
    if (clean.includes('三平方') || clean.includes('ピタゴラス')) return ['三平方', 'ピタゴラス'];
    if (clean.includes('一次関数') || clean.includes('傾き')) return ['一次関数', '変化の割合', '傾き'];
    if (clean.includes('連立方程式') || clean.includes('連立')) return ['連立方程式', '連立'];
    if (clean.includes('オーム')) return ['オーム', '回路', '電流'];
    if (clean.includes('時差')) return ['時差', '経度'];
    if (clean.includes('関係代名詞')) return ['関係代名詞'];
    if (clean.includes('現在完了')) return ['現在完了'];
    if (clean.includes('地図記号')) return ['地図記号'];
    if (clean.includes('たしざん')) return ['たしざん', 'たす', 'あわせる', '＋'];
    if (clean.includes('ひきざん')) return ['ひきざん', 'ひく', 'のこり', '-'];
    if (clean.includes('わり算') || clean.includes('あまり')) return ['わり算', '割', 'あまり', '÷'];
    if (clean.includes('九九') || clean.includes('かけ算')) return ['九九', 'かけ算', '×'];

    return [clean];
  };

  const unitKeywords = isStrictUnitMode ? getUnitKeywords(unitName) : [];

  // 1. 固定問題のフィルタリング
  let matchingFixed = fixedQuestions.filter(q => q.subject === subject && (grade ? q.grade === grade : true));

  // 🧠 間隔反復（SRS）判定: 完全マスター済みおよびクールダウン中（1週間・4週間・1ヶ月待ち）の問題を除外
  if (srsData) {
    matchingFixed = matchingFixed.filter(q => {
      const srsItem = srsData[generateQuestionKey(q)];
      return isQuestionAvailableForDailyQuiz(srsItem, today);
    });
  }

  if (isStrictUnitMode) {
    matchingFixed = matchingFixed.filter(q => {
      // 特殊除外ルール: 平方根単元に二次方程式の問題が混入するのを防ぐ
      if (unitName.includes('平方根') && (q.questionText.includes('二次方程式') || q.explanation.includes('二次方程式') || q.questionText.includes('解の公式'))) {
        return false;
      }
      return unitKeywords.some(kw => q.questionText.includes(kw) || q.explanation.includes(kw));
    });
  }

  // 🌟 復習期日を迎えた問題（忘却曲線の黄金タイミング）を最優先プールに分ける
  const dueFixed: Question[] = [];
  const freshFixed: Question[] = [];

  matchingFixed.forEach(q => {
    const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
    if (srsItem && srsItem.stage > 0 && srsItem.nextAvailableAt <= today && !srsItem.isMastered) {
      dueFixed.push(q);
    } else {
      freshFixed.push(q);
    }
  });

  // 通常問題をシャッフルした上に、復習期日到来問題を最優先（popで先に出るように末尾）に配置
  const pool = [
    ...freshFixed.sort(() => Math.random() - 0.5),
    ...dueFixed.sort(() => Math.random() - 0.5)
  ];

  let attempts = 0;
  while (resultSet.length < count && attempts < 500) {
    attempts++;

    // 固定問題プールからの抽出
    if (pool.length > 0 && (!isStrictUnitMode || attempts % 2 === 0)) {
      const candidate = pool.pop();
      if (candidate && !usedTexts.has(candidate.questionText) && !excludeIds.includes(candidate.id)) {
        usedTexts.add(candidate.questionText);
        resultSet.push(candidate);
        continue;
      }
    }

    // 動的問題の生成
    const dyn = generateDynamicQuestion(subject, grade, unitName);
    const dynKey = generateQuestionKey(dyn);
    const dynSrsItem = srsData ? srsData[dynKey] : undefined;

    // 動的問題もクールダウン中・マスター済みの場合は除外
    if (srsData && !isQuestionAvailableForDailyQuiz(dynSrsItem, today)) {
      continue;
    }

    if (!usedTexts.has(dyn.questionText) && !excludeIds.includes(dyn.id)) {
      usedTexts.add(dyn.questionText);
      resultSet.push(dyn);
    }
  }

  // 万が一特定単元でユニーク数がまだ足りない場合の安全フォールバック
  // （重複や水増しを行わず、同教科・同学年の問題生成からユニークな問題を充当）
  let safeAttempts = 0;
  while (resultSet.length < count && safeAttempts < 300) {
    safeAttempts++;
    // 単元指定を外して同学年・同教科の関連問題を動的生成
    const dyn = generateDynamicQuestion(subject, grade);
    const dynKey = generateQuestionKey(dyn);
    const dynSrsItem = srsData ? srsData[dynKey] : undefined;

    if (srsData && !isQuestionAvailableForDailyQuiz(dynSrsItem, today)) {
      continue;
    }

    if (!usedTexts.has(dyn.questionText) && !excludeIds.includes(dyn.id)) {
      usedTexts.add(dyn.questionText);
      resultSet.push(dyn);
    }
  }

  return resultSet;
};
