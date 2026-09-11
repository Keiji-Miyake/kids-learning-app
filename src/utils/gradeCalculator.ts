/**
 * 日本の学校教育法および年齢計算に関する法律に準拠した学年計算ユーティリティ
 */

export interface GradeCalculationResult {
  grade: number;        // 1〜9 (小1〜中3), 0: 未就学, 10: 高校生以上
  label: string;        // "小学3年", "未就学", "高校生以上" など
  isSchoolAge: boolean; // 小1〜中3の義務教育期間内かどうか
}

/**
 * 任意の日付の学校年度（4月1日〜翌年3月31日）の西暦年度を取得
 */
export const getFiscalYear = (date: Date): number => {
  const month = date.getMonth() + 1; // 1〜12
  const year = date.getFullYear();
  return month >= 4 ? year : year - 1;
};

/**
 * 生年月日からその人の学校年度（早生まれ: 1月1日〜4月1日生まれを考慮）を取得
 * 日本の法律では誕生日前日午後12時に満年齢に達するため、
 * 4月1日生まれの人は3月31日に満年齢に達し、前年度扱い（同学年）となる。
 */
export const getBirthFiscalYear = (birthDate: Date): number => {
  // 生年月日から1日引くことで、4月1日生まれを3月31日扱い（前年度生まれ）にする
  const adjusted = new Date(birthDate.getTime());
  adjusted.setDate(adjusted.getDate() - 1);
  return getFiscalYear(adjusted);
};

/**
 * 学年番号 (1〜9, 0, 10) を日本語の学年表記に変換
 */
export const formatGradeLabel = (grade: number): string => {
  if (grade <= 0) return '未就学';
  if (grade <= 6) return `小学${grade}年`;
  if (grade <= 9) return `中学${grade - 6}年`;
  return '高校生以上';
};

/**
 * 生年月日文字列 (YYYY-MM-DD) から基準日時点の学年を計算
 */
export const calculateGradeFromBirthDate = (
  birthDateStr: string,
  baseDate: Date = new Date()
): GradeCalculationResult => {
  if (!birthDateStr) {
    return { grade: 3, label: '小学3年', isSchoolAge: true };
  }

  const parts = birthDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return { grade: 3, label: '小学3年', isSchoolAge: true };
  }

  // タイムゾーンによる日付ずれを防ぐため、年・月・日を直接指定
  const birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  const birthFiscalYear = getBirthFiscalYear(birthDate);
  const currentFiscalYear = getFiscalYear(baseDate);

  // 学年計算: 小学校入学年度は満6歳に達した翌年度 (currentFiscalYear - birthFiscalYear - 6 = 1)
  const diff = currentFiscalYear - birthFiscalYear - 6;

  if (diff < 1) {
    return {
      grade: 0,
      label: formatGradeLabel(0),
      isSchoolAge: false
    };
  }

  if (diff > 9) {
    return {
      grade: 10,
      label: formatGradeLabel(10),
      isSchoolAge: false
    };
  }

  return {
    grade: diff,
    label: formatGradeLabel(diff),
    isSchoolAge: true
  };
};
