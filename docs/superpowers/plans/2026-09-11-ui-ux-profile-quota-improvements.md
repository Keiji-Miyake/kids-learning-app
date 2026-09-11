# UI/UX改善・プロフィール一元管理・ノルマ連打＆放置対策 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 未ログイン時でも管理画面へ直接アクセス可能にし、管理画面から全プロフィールの編集・管理を行えるようにするとともに、クイズの連打・放置による不正なノルマ達成を防止し、全体のUI/UXを向上させる。

**Architecture:**
- `ProfileSelectorModal` に保護者管理画面へのダイレクトボタンを配置し、未ログイン状態から直接 `ParentDashboard` を表示可能にする。
- `ParentDashboard` に「👥 プロフィール管理」タブ/セクションを新設し、保護者認証下で全プロフィールの編集・追加・削除を一括管理する。
- `goalEvaluator.ts` において、問題数ノルマ判定に「正答率50%以上」を適用し、当てずっぽうな連打での達成をシャットアウトする。
- `QuizScreen.tsx` に「0.8秒の早押しガード」「タイムアウト所要時間の学習時間除外」「2問連続タイムアウト時の自動一時停止（休憩中ポップアップ）」を実装し、放置による時間稼ぎを防止する。
- 全体UI/UX（メッセージ、デザイン、アニメーション）を調整し、子どもにも保護者にも親しみやすいUIを提供する。

**Tech Stack:** React, TypeScript, Vitest, CSS3

## Global Constraints
- 言語ルール: コメント、テスト名、ユーザー向け表示はすべて日本語を使用する。
- テスト実行: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
- 既存の51テストファイル・143テストの互換性を維持する。

---

### Task 1: ノルマ連打対策（正答率50%以上必須判定）の実装

**Files:**
- Modify: `src/utils/goalEvaluator.ts`
- Test: `src/__tests__/quota_anti_gaming_accuracy.test.ts`

**Interfaces:**
- Consumes: `checkIsDailyGoalAchieved(goal, report, profileGrade)`
- Produces: 正答率50%未満のセッション・日次集計では、規定問題数をクリアしていても `isAchieved: false` と判定する拡張ロジック。

- [ ] **Step 1: 失敗するテストを作成**
  - 問題数を達成していても、正答率が50%未満の場合は `checkIsDailyGoalAchieved` が `false` を返し、50%以上の場合は `true` を返すテストを記述。
- [ ] **Step 2: テストを実行して失敗することを確認**
  - `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/quota_anti_gaming_accuracy.test.ts`
- [ ] **Step 3: `goalEvaluator.ts` に正答率50%以上判定を実装**
  - `checkIsDailyGoalAchieved` 内で、問題数チェックに加えて `questionsCorrect / questionsAttempted >= 0.5` を検証。
- [ ] **Step 4: テストを実行して成功することを確認**
- [ ] **Step 5: コミット**

---

### Task 2: クイズ画面の連打防止・時間放置防止機能の実装

**Files:**
- Modify: `src/components/QuizScreen.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/quiz_anti_gaming.test.tsx`

**Interfaces:**
- Consumes: `QuizScreenProps`, `onFinish(correctCount, totalCount, wrongQuestionIds, questionRecords, activeDurationSeconds)`
- Produces:
  - 800msの早押し無効化
  - タイムアウト問題の時間を有効学習時間から除外する `activeDurationSeconds`
  - 2問連続タイムアウト時の「🍵 きゅうけいちゅう」自動一時停止モーダル

- [ ] **Step 1: 失敗するテストを作成**
  - 連打防止ディレイ、タイムアウト除外、アイドル一時停止の振る舞いを検証するテストを作成。
- [ ] **Step 2: テストを実行して失敗することを確認**
- [ ] **Step 3: `QuizScreen.tsx` および `App.tsx` に実装**
  - 出題後800msのボタンロック＆連打警告トースト
  - 有効学習時間の計測とタイムアウト問題の除外
  - 2問連続タイムアウトでの一時停止と再開ボタン
- [ ] **Step 4: テストを実行して成功することを確認**
- [ ] **Step 5: コミット**

---

### Task 3: プロフィール選択画面からの管理画面ダイレクトアクセスの実装

**Files:**
- Modify: `src/components/ProfileSelectorModal.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/direct_parent_dashboard_access.test.tsx`

**Interfaces:**
- Consumes: `ProfileSelectorModalProps`, `onOpenDashboard: () => void`
- Produces: 未ログイン状態から保護者認証を経て直接 `ParentDashboard` を表示し、戻るボタンで再びプロファイル選択画面に戻るフロー。

- [ ] **Step 1: 失敗するテストを作成**
  - プロフィール選択画面に「⚙️ 保護者管理画面へ」ボタンが存在し、押下時にコールバックまたは認証フローが呼び出されることをテスト。
- [ ] **Step 2: テストを実行して失敗することを確認**
- [ ] **Step 3: 実装**
  - `ProfileSelectorModal` に保護者管理画面遷移用ボタンとハンドラーを追加。
  - `App.tsx` で未ログイン状態のフラグ/ステートを管理し、ParentDashboard を開閉できるように連携。
- [ ] **Step 4: テストを実行して成功することを確認**
- [ ] **Step 5: コミット**

---

### Task 4: 管理画面（ParentDashboard）での全プロフィール一元管理機能の実装

**Files:**
- Modify: `src/components/ParentDashboard.tsx`
- Test: `src/__tests__/parent_dashboard_profile_management.test.tsx`

**Interfaces:**
- Consumes: `storage.getProfiles()`, `storage.updateProfile()`, `storage.addProfile()`, `storage.deleteProfile()`
- Produces: 管理画面内に「👥 プロフィール管理」タブを追加し、全プロフィールの編集・追加・削除を保護者が直接行える機能。

- [ ] **Step 1: 失敗するテストを作成**
  - 管理画面でプロフィール管理タブを選択し、プロフィールの情報編集や更新が反映されることをテスト。
- [ ] **Step 2: テストを実行して失敗することを確認**
- [ ] **Step 3: 実装**
  - `ParentDashboard.tsx` にタブナビゲーション（レポート/ノルマ/プロフィール/設定）を導入。
  - プロフィール管理カード一覧と編集モーダル/フォームを実装。
- [ ] **Step 4: テストを実行して成功することを確認**
- [ ] **Step 5: コミット**

---

### Task 5: 全体UI/UX改善（デザイン・進捗メッセージ・アニメーション）

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/QuizScreen.tsx`
- Modify: `src/components/ParentDashboard.tsx`

- [ ] **Step 1: スタイルとメッセージの改善**
  - ノルマ進捗バーに「あと◯問正解で達成！」「あと◯分！」などの応援メッセージを表示。
  - クイズ画面の連打警告・休憩中モーダルの親しみやすいデザインスタイルを追加。
  - 管理画面のタブとプロフィールカードのスタイルを整備。
- [ ] **Step 2: 表示とスタイルの動作確認**
- [ ] **Step 3: コミット**

---

### Task 6: 全体回帰テストと動作検証

**Files:**
- All

- [ ] **Step 1: 全テストスイートの実行**
  - `wsl --cd /home/dev/workspace/kids-learning-app npm test`
  - 全テストが正常に通過することを確認。
- [ ] **Step 2: Lintチェックの実行**
  - `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
- [ ] **Step 3: 最終コミットとまとめ**

