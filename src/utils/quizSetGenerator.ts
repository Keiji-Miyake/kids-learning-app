import type { Question, Subject } from '../types';
import { generateDynamicQuestion } from './questionGenerator';
import { questions as fixedQuestions } from '../data/questions';

export const generateUniqueQuizSet = (
  subject: Subject,
  grade: number,
  count: number = 5,
  unitName?: string,
  excludeIds: string[] = []
): Question[] => {
  const resultSet: Question[] = [];
  const usedTexts = new Set<string>();

  const isStrictUnitMode = !!(unitName && unitName !== 'all');

  // 単元一致判定キーの作成 (例: "平方根" -> ["平方根", "√", "ルート"])
  const getUnitKeywords = (u: string): string[] => {
    if (u.includes('平方根') || u.includes('√')) return ['平方根', '√', 'ルート'];
    if (u.includes('因数分解') || u.includes('展開')) return ['因数分解', '展開', '公式'];
    if (u.includes('二次方程式')) return ['二次方程式', 'x²'];
    if (u.includes('相似')) return ['相似'];
    if (u.includes('三平方')) return ['三平方', 'ピタゴラス'];
    return [u];
  };

  const unitKeywords = isStrictUnitMode ? getUnitKeywords(unitName) : [];

  // 1. 固定問題のフィルタリング
  let matchingFixed = fixedQuestions.filter(q => q.subject === subject && (grade ? q.grade === grade : true));

  if (isStrictUnitMode) {
    matchingFixed = matchingFixed.filter(q => 
      unitKeywords.some(kw => q.questionText.includes(kw) || q.explanation.includes(kw))
    );
  }

  const pool = [...matchingFixed].sort(() => Math.random() - 0.5);

  let attempts = 0;
  while (resultSet.length < count && attempts < 500) {
    attempts++;

    // 単元モードの場合、単元連動の動的問題生成を100%優先
    if (isStrictUnitMode) {
      if (pool.length > 0 && attempts % 3 === 0) {
        const candidate = pool.pop();
        if (candidate && !usedTexts.has(candidate.questionText) && !excludeIds.includes(candidate.id)) {
          usedTexts.add(candidate.questionText);
          resultSet.push(candidate);
          continue;
        }
      }
      const dyn = generateDynamicQuestion(subject, grade, unitName);
      if (!usedTexts.has(dyn.questionText) && !excludeIds.includes(dyn.id)) {
        usedTexts.add(dyn.questionText);
        resultSet.push(dyn);
        continue;
      }
    } else {
      // 通常のランダムモード
      if (pool.length > 0) {
        const candidate = pool.pop();
        if (candidate && !usedTexts.has(candidate.questionText) && !excludeIds.includes(candidate.id)) {
          usedTexts.add(candidate.questionText);
          resultSet.push(candidate);
          continue;
        }
      }
      const dyn = generateDynamicQuestion(subject, grade, unitName);
      if (!usedTexts.has(dyn.questionText) && !excludeIds.includes(dyn.id)) {
        usedTexts.add(dyn.questionText);
        resultSet.push(dyn);
      }
    }
  }

  // 万が一足りない場合の安全フォールバック補完（100%指定問題数を保証）
  let fallbackCounter = 1;
  while (resultSet.length < count) {
    const dyn = generateDynamicQuestion(subject, grade, unitName);
    const uniqueId = `${dyn.id}-v${fallbackCounter}`;
    const uniqueText = `${dyn.questionText} 【第${fallbackCounter}問】`;
    if (!usedTexts.has(uniqueText)) {
      usedTexts.add(uniqueText);
      resultSet.push({
        ...dyn,
        id: uniqueId,
        questionText: uniqueText
      });
    }
    fallbackCounter++;
  }

  return resultSet;
};
