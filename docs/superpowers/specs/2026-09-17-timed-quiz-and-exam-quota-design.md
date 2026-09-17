# 学習時間達成 ＋ 仕上げテスト合格による2段階ノルマ達成システム 設計仕様書

## 1. 概要と背景

### 課題
1. **時間の経過だけで達成してしまう問題**:
   - これまでの「学習時間ノルマ」では、指定された時間が経過すれば問題の理解度に関わらずノルマが達成となっていた。
   - そのため、内容を十分に理解していなくても時間さえ経てばクリアできてしまい、学習の実効性が弱まる懸念があった。
2. **学習のメリハリと達成感の不足**:
   - 延々とクイズを解くだけでなく、「練習でしっかり学んだ成果をテストで発揮して合格する」というゲーム的な達成目標（ボス戦のような目標）が求められていた。

### 目的
1. **学習時間の確保 ＋ 理解度の確認の両立**:
   - 各教科、保護者が設定した目標学習時間（例: 2分〜10分）をしっかり練習クイズで学習する。
   - 時間を満たすと「🔥 仕上げテスト」がロック解除される。
   - 仕上げテスト（5問・80%合格）に合格して初めて、その教科のノルマが「正式達成」となる。
2. **子どもがワクワクするステップ制のUI/UX**:
   - 「練習中 ⏳」→「テスト解放！ 🔥」→「テスト合格！ 🎉」という状態変化をホーム画面のノルマカードで直感的に提示する。

---

## 2. データモデルと永続化（Storage & DB）

### 2.1 DailyReport の拡張 (src/types/index.ts)
その日の各教科におけるテスト合格状況を追跡するため、DailyReport インターフェースに examPassed を追加する。

```typescript
export interface DailyReport {
  date: string;
  totalQuestions?: number;
  questionsAttempted: number;
  questionsCorrect: number;
  subjectMinutes: Record<Subject, number>;
  subjectBreakdown?: Partial<Record<Subject, { total: number; correct?: number }>>;
  sessions?: QuizSession[];
  examPassed?: Partial<Record<Subject, boolean>>; // 教科ごとの仕上げテスト合格フラグ
}
```

### 2.2 テスト合格の記録 (src/utils/storage.ts)
- テスト合格時に storage.recordExamPassed(subject: Subject, profileId?: string) を実行。
- 本日のレポートの examPassed[subject] = true をセットし、localStorage およびサーバー（PUT /api/reports/:profileId）へ即時同期。
- 日付リセット（resetTodayReport や日付変更時）には examPassed も初期化される。

---

## 3. ノルマ達成判定ロジック (src/utils/goalEvaluator.ts)

### 3.1 教科ごとの達成判定（SubjectGoalSummary）
各教科の個別目標（subjectGoals）の完了条件に「仕上げテスト合格」を組み込む。

- **時間目標（targetMinutes > 0）が設定されている教科**:
  - isTimeCompleted: currentMinutes >= targetMinutes
  - isExamCompleted: report.examPassed?.[subject] === true
  - **完了判定（isCompleted）**: isTimeCompleted && isExamCompleted
  - ※時間が未達の間はテストはロック状態。時間が達した時点でテスト受験可能となり、テスト合格で教科完了。

- **問題数目標（targetQuestions > 0）のみ設定されている教科**:
  - 従来通り、問題数達成 ＋ 正答率50%以上で達成（テスト必須は時間目標がある場合を対象とする）。

### 3.2 進捗表示アイテム（SubjectProgressItem）の拡張
子ども画面や保護者画面で、現在のステップがひと目でわかるようプロパティを追加。

`	ypescript
export interface SubjectProgressItem {
  subject: Subject;
  label: string;
  isCompleted: boolean;
  currentQuestions: number;
  targetQuestions: number;
  currentMinutes: number;
  targetMinutes: number;
  isTimeCompleted: boolean;  // 学習時間を満たしたか
  isExamUnlocked: boolean;   // 仕上げテストが解放されたか
  isExamPassed: boolean;     // 仕上げテストに合格したか
}
`

### 3.3 全体達成判定（checkIsDailyGoalAchieved / getGoalProgress）
- 設定された全教科の isCompleted がすべて true になった場合のみ isAchieved: true と判定。
- 一部の教科がテスト未合格の場合は、全体の達成モーダル（「きょうのノルマ達成！おめでとう！」）は発火しない。

---

## 4. 画面UIと操作フロー（UI / UX）

### 4.1 ホーム画面「きょうのノルマ」カード
各教科の枠にステップ進行を表示：
1. **Step 1（時間未達）**:
   - 🧮 算数: 1.0 / 2.0分 ＋ 🔒 仕上げテスト（残り1.0分で解放）
2. **Step 2（時間達成・テスト未受験）**:
   - 🧮 算数: 2.0 / 2.0分 ✅ ＋ 🔥 [仕上げテストに挑戦！]（ボタン点灯）
   - ボタンをタップすると、その教科の仕上げテスト（ExamScreen）が直接起動。
3. **Step 3（テスト合格・教科達成）**:
   - 🧮 算数: 🎉 達成！（テスト合格 5問中4問正解）

### 4.2 仕上げテスト画面（ExamScreen.tsx の連動）
- **出題形式**:
  - ノルマに設定された教科・単元から 5問 を出題。
  - テスト中は1問ごとの正誤判定を出さず、本番テストとして集中して5問回答。
- **採点と合否判定**:
  - **合格基準**: 5問中4問以上正解（正答率 80% 以上）。
  - **合格時**:
    - 紙吹雪・ファンファーレ演出。
    - 「テスト合格！算数のノルマを達成したよ！🏆」
    - 全教科クリアの場合は「きょうのノルマ達成！」モーダルへシームレスに遷移。
  - **不合格時（3問以下）**:
    - 「おしい！あと少しで合格だよ！」
    - 間違えた問題の解説一覧を表示（復習ノートへも自動登録）。
    - 「🔄 もう一度テストを受ける」ボタンで、新しい問題セットに何度でも再挑戦可能。
    - テストにかかった時間も学習時間として計上される。

---

## 5. 保護者管理画面（ParentDashboard.tsx）の表示
- 「📊 今日の進捗」カードにて、各教科が「練習中」「テスト待ち」「テスト合格」のどの段階にあるかを可視化。
- 「📅 日々の記録」アコーディオン内に、仕上げテストのセッション（スコア・合否・解いた5問）を明記。

---

## 6. テスト・検証計画

### 6.1 自動テスト（vitest）
1. **goalEvaluator のステップ制判定テスト**:
   - 学習時間が未達の場合、テスト合格フラグがあっても教科未達成。
   - 学習時間を満たしても、テスト未合格なら教科未達成（isExamUnlocked = true, isCompleted = false）。
   - 学習時間を満たし、テストに合格（80%以上）した時点で教科達成（isCompleted = true）。
   - 全教科達成時のみ全体の isAchieved = true。
2. **storage の examPassed 永続化テスト**:
   - recordExamPassed で正しくレポートに記録・更新されること。
   - サーバーへの PUT リクエストが正しく送られること。
3. **UI レンダリングテスト**:
   - ホーム画面のノルマカードで、ステップに応じたラベル・テスト挑戦ボタンが正しく描画されること。

### 6.2 実機検証
- home-gateway にビルド＆デプロイ後、実際にちひろ・はるとのプロファイルで時間を進めてテスト解放を確認し、テスト合格でノルマ達成になることを確認。
