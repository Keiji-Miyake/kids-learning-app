import { questions } from '../data/questions';

export function validateAllData(): { success: boolean; errors: string[]; stats: any } {
  const errors: string[] = [];
  const idSet = new Set<string>();

  const subjectGradeCount: Record<string, number> = {};

  questions.forEach((q, index) => {
    const loc = `問題 #${index + 1} (ID: ${q.id})`;

    // 1. IDユニーク性
    if (idSet.has(q.id)) {
      errors.push(`${loc}: ID "${q.id}" が重複しています。`);
    } else {
      idSet.add(q.id);
    }

    // 2. 選択肢チェック
    if (!q.options || q.options.length < 2) {
      errors.push(`${loc}: 選択肢が2つ未満です。`);
    }

    // 3. 正解が選択肢に含まれているか
    if (!q.options.includes(q.correctAnswer)) {
      errors.push(`${loc}: 正解 "${q.correctAnswer}" が選択肢 [${q.options.join(', ')}] の中に存在しません！`);
    }

    // 4. 学年・教科のカウント
    const key = `${q.subject}-grade${q.grade}`;
    subjectGradeCount[key] = (subjectGradeCount[key] || 0) + 1;
  });

  return {
    success: errors.length === 0,
    errors,
    stats: {
      totalQuestions: questions.length,
      distribution: subjectGradeCount
    }
  };
}

// Node.js直接実行時用スクリプト
const proc = (globalThis as any).process;
if (typeof proc !== 'undefined' && proc.argv) {
  const result = validateAllData();
  console.log('====== 🔍 データ自動品質検証テスト結果 ======');
  console.log(`総問題数: ${result.stats.totalQuestions} 問`);
  console.log('検証ステータス:', result.success ? '✅ PASSED (全データ正常)' : '❌ FAILED');

  if (!result.success) {
    console.error('エラー内容:');
    result.errors.forEach((e: string) => console.error(` - ${e}`));
    proc.exit(1);
  } else {
    console.log('すべての問題の正解・選択肢・IDユニーク性が正常であることを証明しました。');
  }
}
