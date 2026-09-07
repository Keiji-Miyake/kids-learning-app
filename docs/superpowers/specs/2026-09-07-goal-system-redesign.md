# 設計仕様書: 学習管理システムの機能拡張とUX改善

- **作成日**: 2026-09-07
- **ステータス**: 設計承認済み (Approved)
- **対象プロダクト**: Kids LearnQuest (子供向け学習管理システム)

---

## 1. 概要と目的

子供向け学習支援アプリ「Kids LearnQuest」において、保護者が子供の目標（ノルマ）を直感的に設定・確認できるように機能拡張とUX改善を行う。
特に「問題数重視」「時間重視」「科目別目標」の選択、および科目ごとに「問題数」「学習時間」の両方または一方を設定できる仕組みを導入し、目的選択型のウィザード形式とダッシュボード進捗の可視化を実現する。

---

## 2. 要件詳細

### 2.1 データ構造の拡張 (Backend & Frontend Types)

1. **目標タイプ (`goalType`) の拡張**:
   - `'subject_specific'`: 科目別目標（デフォルト）。科目ごとに問題数・時間を個別設定。
   - `'total_count'`: 合計問題数重視。1日の総解答数のみで判定。
   - `'total_time'`: 合計時間重視。1日の総学習時間（分）のみで判定。

2. **科目別目標 (`subjectGoals`) の拡張**:
   - `Partial<Record<Subject, { targetQuestions: number; targetMinutes: number }>>`
   - 各科目について `targetQuestions` (問) と `targetMinutes` (分) を独立して保持。

3. **セッション履歴 (`QuizSession` 配列) の保持**:
   - 各クイズセッション完了時、レポート内に以下の履歴を記録:
     ```typescript
     export interface QuizSession {
       subject: Subject;
       questionsAttempted: number;
       questionsCorrect: number;
       durationMinutes: number;
       timestamp: string;
     }
     ```
   - 日次レポート (`DailyReport`) 内に `sessions?: QuizSession[]` を保持し、`subjectMinutes` および `subjectBreakdown` と同期。

---

### 2.2 達成判定ロジック (`goalEvaluator.ts`)

- `checkIsDailyGoalAchieved(goal, report)`:
  - **`total_count`**:
    - `todayAttempted >= (goal.targetQuestions || 5)`
  - **`total_time`**:
    - `totalMinutes >= (goal.targetMinutes || 10)`
  - **`subject_specific`**:
    - 設定された各科目について：
      - `targetQuestions > 0 && targetMinutes > 0`: 問題数と時間の両方を満たせば科目クリア
      - `targetQuestions > 0 && targetMinutes === 0`: 問題数を満たせば科目クリア
      - `targetQuestions === 0 && targetMinutes > 0`: 時間を満たせば科目クリア
      - 両方0の科目は判定対象外（スキップ）
    - 設定があるすべての科目でクリアしていれば全体達成。設定科目が1つもない場合はフォールバックとして全体問題数で判定。

- `getGoalProgress(goal, report)`:
  - 目標タイプに応じた進捗率（0〜100%）、現在の実績値、目標値、科目ごとの詳細ステータス（問題数実績/目標、時間実績/目標、達成フラグ）を返す統一ヘルパー。

---

### 2.3 設定画面のUX改善 (`GoalSettingWizard.tsx`)

保護者ダッシュボード（`ParentDashboard.tsx`）からノルマ設定領域を分離し、**3ステップ目的選択型ウィザード**を構築。

1. **ステップ 1: 目標タイプの選択**
   - 3つの目的カード（科目別目標 / 合計問題数重視 / 合計時間重視）から選択。
   - デフォルトは「科目別目標」。カードクリックで選択切り替え、「次へ進む ➡️」。

2. **ステップ 2: 動的な目標値入力**
   - 選択したタイプに応じた入力欄のみを動的に表示:
     - `total_count`: 目標問題数セレクト/入力
     - `total_time`: 目標時間セレクト/入力
     - `subject_specific`: 5教科カードリスト（各科目ごとに目標問題数・目標時間を並べて入力）
   - 「⬅️ もどる」「次へ進む ➡️」。

3. **ステップ 3: ご褒美・約束の設定と保存**
   - 約束・ご褒美テキスト入力（クイックチップ付き）。
   - 設定内容のサマリープレビュー確認。
   - 「⬅️ もどる」「ノルマ・ご褒美を保存する 💾」。
   - 保存完了通知トースト。

---

### 2.4 ダッシュボード ＆ メイン画面の進捗可視化

1. **進捗バー**:
   - `total_count`: 「X / Y 問 (Z%)」
   - `total_time`: 「X / Y 分 (Z%)」
   - `subject_specific`: 「設定科目クリア数 / 全設定科目数 (Z%)」

2. **科目別進捗表示**:
   - `subject_specific` の場合、設定科目の進捗カード/バッジを表示:
     - 問題数・時間の両方設定時: 「🧮 算数: 2/5問, 3/5分」
     - 問題数のみ設定時: 「🧮 算数: 2/5問」
     - 時間のみ設定時: 「🧮 算数: 3/5分」
     - 達成時は「✅ 達成!」バッジを表示。

3. **反映先**:
   - 保護者ダッシュボード (`ParentDashboard.tsx`)
   - お子様トップ画面 (`App.tsx` の「きょうのノルマ」カード)

---

### 2.5 既存データの互換性

- `dailyGoal` に `goalType` がない旧データは `'subject_specific'` として安全に扱う。
- `subjectGoals` が数値のみの旧データは `{ targetQuestions: val, targetMinutes: 0 }` として扱う。
- `sessions` がない旧レポートでも `subjectMinutes` や `questionsAttempted` からそのまま進捗計算可能。
- `server.js` は既存の API エンドポイント互換性を維持し、`db.json` の欠落フィールド自動補完を行う。

---

## 3. テスト・検証計画

1. **TDDによる判定ロジック検証**:
   - `goal_evaluation_extended.test.ts`
     - `total_count`, `total_time`, `subject_specific` の各達成判定
     - 問題数のみ、時間のみ、両方設定の各パターン検証
     - 旧データ互換性検証
2. **セッション記録検証**:
   - `session_report_storage.test.ts`
     - クイズ完了時に `sessions` 配列が `DailyReport` に記録され、時間と問題数が正しく反映されること
3. **ウィザードUIおよび進捗表示検証**:
   - `goal_wizard_and_dashboard.test.ts`
     - 3ステップウィザードの遷移と動的フォーム切り替え
     - 保存処理とプロファイル更新
4. **全テスト実行**:
   - `wsl --cd /home/dev/workspace/kids-learning-app npm test`
   - `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
