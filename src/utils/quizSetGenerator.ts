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
  const sessionUsedTexts = new Set<string>();
  const sessionUsedIds = new Set<string>();
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
    if (clean.includes('オーム') || clean.includes('回路') || clean.includes('電流')) return ['オーム', '回路', '電流', '電圧', '抵抗'];
    if (clean.includes('化学変化') || clean.includes('原子') || clean.includes('分子')) return ['化学変化', '原子', '分子', '化学反応', '酸化', '還元', '化合', '分解', '元素'];
    if (clean.includes('水溶液') || clean.includes('イオン') || clean.includes('中和')) return ['水溶液', 'イオン', '中和', '酸', 'アルカリ', '電解質'];
    if (clean.includes('地震') || clean.includes('火山') || clean.includes('大地')) return ['地震', '震度', 'P波', 'S波', 'マグニチュード', '火山', '地層'];
    if (clean.includes('天体') || clean.includes('月') || clean.includes('太陽') || clean.includes('宇宙')) return ['天体', '月', '太陽', '星', '星座', '夏の大三角', '自転', '公転'];
    if (clean.includes('細胞') || clean.includes('遺伝') || clean.includes('生殖')) return ['細胞', '遺伝', '生殖', 'メンデル', '受精', '胚珠', '子房'];
    if (clean.includes('光') || clean.includes('音') || clean.includes('力') || clean.includes('レンズ')) return ['凸レンズ', '焦点', '実像', '反射', '屈折', 'ジュール', '仕事'];
    if (clean.includes('時差')) return ['時差', '経度'];
    if (clean.includes('関係代名詞')) return ['関係代名詞'];
    if (clean.includes('現在完了')) return ['現在完了'];
    if (clean.includes('地図記号')) return ['地図記号'];
    if (clean.includes('地方') || clean.includes('雨温図') || clean.includes('地理')) return ['地方', '雨温図', '気候', '県庁', '特産', '都道府県'];
    if (clean.includes('歴史') || clean.includes('時代') || clean.includes('幕府')) return ['時代', '幕府', '天皇', '将軍', '条約', '戦い', '大政奉還', '平安京', '平城京'];
    if (clean.includes('たしざん')) return ['たしざん', 'たす', 'あわせる', '＋'];
    if (clean.includes('ひきざん')) return ['ひきざん', 'ひく', 'のこり', '-'];
    if (clean.includes('わり算') || clean.includes('あまり')) return ['わり算', '割', 'あまり', '÷'];
    if (clean.includes('九九') || clean.includes('かけ算')) return ['九九', 'かけ算', '×'];

    return [clean];
  };

  const unitKeywords = isStrictUnitMode ? getUnitKeywords(unitName) : [];

  const matchesUnit = (q: Question): boolean => {
    if (!isStrictUnitMode) return true;
    if (unitName && unitName.includes('平方根') && (q.questionText.includes('二次方程式') || q.explanation.includes('二次方程式') || q.questionText.includes('解の公式'))) {
      return false;
    }
    return unitKeywords.some(kw => q.questionText.includes(kw) || q.explanation.includes(kw));
  };

  // セッション内でのみ重複を厳格に排除して追加するヘルパー
  const addCandidate = (cand: Question): boolean => {
    if (resultSet.length >= count) return false;
    if (sessionUsedTexts.has(cand.questionText) || sessionUsedIds.has(cand.id)) {
      return false;
    }
    sessionUsedTexts.add(cand.questionText);
    sessionUsedIds.add(cand.id);
    resultSet.push(cand);
    return true;
  };

  const isExcludedByRecent = (q: Question): boolean => {
    return excludeIds.includes(q.id) || excludeTexts.includes(q.questionText);
  };

  // 基本となる固定問題（同教科・同学年）
  const baseFixed = fixedQuestions.filter(q => q.subject === subject && (grade ? q.grade === grade : true));
  const unitFixed = baseFixed.filter(matchesUnit);

  // --------------------------------------------------------------------------
  // 🌟 Stage 1: 通常出題（理想状態）
  // SRS利用可能 ＋ 直近履歴除外 ＋ 単元一致
  // --------------------------------------------------------------------------
  const stage1Pool = unitFixed.filter(q => {
    const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
    const isSrsAvailable = isQuestionAvailableForDailyQuiz(srsItem, today);
    return isSrsAvailable && !isExcludedByRecent(q);
  });

  const dueFixed: Question[] = [];
  const freshFixed: Question[] = [];
  stage1Pool.forEach(q => {
    const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
    if (srsItem && srsItem.stage > 0 && srsItem.nextAvailableAt <= today && !srsItem.isMastered) {
      dueFixed.push(q);
    } else {
      freshFixed.push(q);
    }
  });

  const prioritizedPool = [
    ...freshFixed.sort(() => Math.random() - 0.5),
    ...dueFixed.sort(() => Math.random() - 0.5)
  ];

  let attempts1 = 0;
  while (resultSet.length < count && attempts1 < 500) {
    attempts1++;

    // 固定問題プールからの抽出
    if (prioritizedPool.length > 0 && (!isStrictUnitMode || attempts1 % 2 === 0)) {
      const candidate = prioritizedPool.pop();
      if (candidate) {
        addCandidate(candidate);
        continue;
      }
    }

    // 動的問題の生成
    const dyn = generateDynamicQuestion(subject, grade, unitName);
    const dynKey = generateQuestionKey(dyn);
    const dynSrsItem = srsData ? srsData[dynKey] : undefined;

    if (srsData && !isQuestionAvailableForDailyQuiz(dynSrsItem, today)) {
      continue;
    }
    if (isExcludedByRecent(dyn)) {
      continue;
    }

    addCandidate(dyn);
  }

  // --------------------------------------------------------------------------
  // 🌟 Stage 2: 直近履歴（excludeTexts, excludeIds）の緩和
  // 単元一致・SRS未出題/復習期日到来は維持し、直前セッションの問題も復習として許可
  // --------------------------------------------------------------------------
  if (resultSet.length < count) {
    const stage2Pool = unitFixed
      .filter(q => {
        const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
        return isQuestionAvailableForDailyQuiz(srsItem, today);
      })
      .sort(() => Math.random() - 0.5);

    for (const q of stage2Pool) {
      if (resultSet.length >= count) break;
      addCandidate(q);
    }

    let dynAttempts = 0;
    while (resultSet.length < count && dynAttempts < 200) {
      dynAttempts++;
      const dyn = generateDynamicQuestion(subject, grade, unitName);
      const dynKey = generateQuestionKey(dyn);
      const dynSrsItem = srsData ? srsData[dynKey] : undefined;

      if (srsData && !isQuestionAvailableForDailyQuiz(dynSrsItem, today)) {
        continue;
      }
      addCandidate(dyn);
    }
  }

  // --------------------------------------------------------------------------
  // 🌟 Stage 3: SRSクールダウン中問題の復習再出題（マスター除外は維持）
  // 単元内の未マスター問題がクールダウン中の場合、復習・ノルマ達成のため再出題
  // LRU（最終解答日時が古い順）＋ランダムシャッフルで偏りを防止
  // --------------------------------------------------------------------------
  if (resultSet.length < count) {
    const coolingFixed = unitFixed
      .filter(q => {
        const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
        return srsItem && !srsItem.isMastered;
      })
      .sort((a, b) => {
        const itemA = srsData ? srsData[generateQuestionKey(a)] : undefined;
        const itemB = srsData ? srsData[generateQuestionKey(b)] : undefined;
        // 1. 最終解答日時が古いもの（昔解いたもの）を優先して復習
        const dateA = itemA?.lastAttemptedAt || '0000-00-00';
        const dateB = itemB?.lastAttemptedAt || '0000-00-00';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        // 2. ステージが低い（記憶定着が浅い）もの優先
        if ((itemA?.stage || 0) !== (itemB?.stage || 0)) {
          return (itemA?.stage || 0) - (itemB?.stage || 0);
        }
        // 3. 同条件の場合は完全ランダムシャッフル
        return Math.random() - 0.5;
      });

    // 動的問題と固定問題をバランスよく交互に補充
    let dynCoolingAttempts = 0;
    while (resultSet.length < count && (coolingFixed.length > 0 || dynCoolingAttempts < 150)) {
      dynCoolingAttempts++;

      // 動的問題の生成を優先的に試行
      if (dynCoolingAttempts % 2 === 1 || coolingFixed.length === 0) {
        const dyn = generateDynamicQuestion(subject, grade, unitName);
        const dynKey = generateQuestionKey(dyn);
        const dynSrsItem = srsData ? srsData[dynKey] : undefined;
        if (!dynSrsItem?.isMastered) {
          addCandidate(dyn);
        }
      } else {
        const q = coolingFixed.shift();
        if (q) {
          addCandidate(q);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 🌟 Stage 4: 同教科・同学年の他単元または総合動的問題の補充
  // 単元指定モード時は他単元を一切混ぜず、指定単元の動的バリエーションのみで補充
  // --------------------------------------------------------------------------
  if (resultSet.length < count) {
    if (!isStrictUnitMode) {
      const fallbackFixed = baseFixed
        .filter(q => {
          const srsItem = srsData ? srsData[generateQuestionKey(q)] : undefined;
          return !srsItem?.isMastered;
        })
        .sort(() => Math.random() - 0.5);

      for (const q of fallbackFixed) {
        if (resultSet.length >= count) break;
        addCandidate(q);
      }

      let generalDynAttempts = 0;
      while (resultSet.length < count && generalDynAttempts < 150) {
        generalDynAttempts++;
        const dyn = generateDynamicQuestion(subject, grade);
        const dynKey = generateQuestionKey(dyn);
        const dynSrsItem = srsData ? srsData[dynKey] : undefined;
        if (dynSrsItem?.isMastered) continue;
        addCandidate(dyn);
      }
    } else {
      // 単元指定モード時は、指定単元の動的バリエーション問題のみを生成
      let unitDynAttempts = 0;
      while (resultSet.length < count && unitDynAttempts < 150) {
        unitDynAttempts++;
        const dyn = generateDynamicQuestion(subject, grade, unitName);
        addCandidate(dyn);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 🌟 Stage 5: マスター済み問題も含めた練習・完全セーフティネット
  // 全問マスター済みの場合でも、マスター済み問題からシャッフルして出題
  // --------------------------------------------------------------------------
  if (resultSet.length < count) {
    const candidateFixed = isStrictUnitMode ? unitFixed : [...unitFixed, ...baseFixed];
    const allFixed = [...candidateFixed].sort(() => Math.random() - 0.5);
    for (const q of allFixed) {
      if (resultSet.length >= count) break;
      addCandidate(q);
    }
  }

  // --------------------------------------------------------------------------
  // 🌟 Stage 6: 動的生成によるカウント充足の絶対保証
  // どのような状況でも空配列を返さず、必ず規定数（count）を生成する
  // --------------------------------------------------------------------------
  let finalEmergency = 0;
  while (resultSet.length < count && finalEmergency < 100) {
    finalEmergency++;
    const dyn = generateDynamicQuestion(subject, grade, unitName);
    // 重複した場合は問題文にバリエーションを付加してセッション内でユニーク化
    if (sessionUsedTexts.has(dyn.questionText)) {
      const variationSuffix = `（練習 ${finalEmergency}）`;
      dyn.questionText = `${dyn.questionText} ${variationSuffix}`;
      dyn.id = `${dyn.id}-em-${finalEmergency}`;
    }
    addCandidate(dyn);
  }

  return resultSet;
};
