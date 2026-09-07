# 曜日別目標スケジュール (Weekly Goal Schedule) Implementation Plan

曜日ごとに学習目標（目標タイプ、時間、問題数、科目別目標、ご褒美）を柔軟に切り替えられる「曜日別目標スケジュール」機能を実装します。

- **Proposed Changes**:
  - `src/types/index.ts`: `DayOfWeek`, `WeeklySchedule`, `UserProfile.weeklySchedule` の定義
  - `src/utils/goalEvaluator.ts`: 今日の目標を取得するヘルパー関数 `getEffectiveDailyGoal` の追加
  - `src/__tests__/weekly_schedule_evaluator.test.ts`: `getEffectiveDailyGoal` の網羅的ユニットテスト
  - `src/components/GoalSettingWizard.tsx`: 曜日トグル、月〜日タブ、コピー機能、個別曜日目標編集機能
  - `src/components/ParentDashboard.tsx`: 曜日別スケジュールの保存連動、進捗表示での曜日バッジ表示
  - `src/App.tsx`: お子様トップ画面での曜日別ノルマ適用と曜日名入り表示
  - `src/__tests__/goal_wizard_weekly.test.tsx`: 曜日別ウィザードの単体テスト
- **Verification Plan**:
  - `npm test`: 全テストパス確認
  - `npm run lint`: エラー0件
  - `npm run build`: プロダクションビルド成功

---

### Task 1: データ構造の拡張とヘルパー関数の実装 (TDD)
1. `src/types/index.ts` に `DayOfWeek` および `WeeklySchedule` 型を追加、`UserProfile` に `weeklySchedule?: WeeklySchedule` を追加。
2. `src/__tests__/weekly_schedule_evaluator.test.ts` を作成（Red）:
   - スケジュール未設定・OFF時に基本目標が返ること
   - スケジュールON時に指定曜日の目標が返ること
   - スケジュールON時でも未設定曜日には基本目標がフォールバックされること
3. `src/utils/goalEvaluator.ts` に `getEffectiveDailyGoal` を実装（Green）。
4. テスト実行＆コミット。

### Task 2: 設定ウィザードの曜日別スケジュール対応
1. `src/components/GoalSettingWizard.tsx` に以下の機能を追加:
   - 「📅 曜日ごとにノルマを変える」トグルスイッチ
   - 月〜日の7曜日タブ切り替え
   - 各曜日の `DailyGoal` 編集とプレビュー
   - コピー機能（基本目標からコピー、平日にコピー、全曜日にコピー）
   - 保存時に `dailyGoal` と `weeklySchedule` をコールバック
2. `src/__tests__/goal_wizard_weekly.test.tsx` でウィザードの動作をテスト。
3. テスト実行＆コミット。

### Task 3: ダッシュボード＆メイン画面の連動表示
1. `src/components/ParentDashboard.tsx`:
   - `handleSaveGoal` で `dailyGoal` と `weeklySchedule` を保存
   - `getEffectiveDailyGoal(targetProfile)` で本日の進捗を計算・表示
   - 曜日バッジ（例: `📅 火曜日の目標適用中`）の表示
2. `src/App.tsx`:
   - `getEffectiveDailyGoal(activeProfile)` でノルマ判定・進捗バーを更新
   - タイトルに曜日を表示（例: `きょうのノルマ (火曜日)`）
3. テスト実行＆コミット。

### Task 4: 総合検証とビルド確認
1. `wsl --cd /home/dev/workspace/kids-learning-app npm test`
2. `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
3. `wsl --cd /home/dev/workspace/kids-learning-app npm run build`
4. コミット。

### Task 5: 本番サーバー (`home-gateway`) への再デプロイ
1. `npm run build` 成果物を `app-release.tar.gz` にアーカイブ（`--exclude=db.json`）
2. `scp` で `home-gateway:/tmp/` へ転送
3. サーバー上で展開し `systemctl --user restart kids-learning-app.service`
4. 疎通・稼働確認
