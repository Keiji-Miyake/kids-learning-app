# 曜日別目標スケジュール 機能設計仕様書

- **作成日**: 2026-09-07
- **ステータス**: Approved
- **対象**: Kids LearnQuest (kids-learning-app)

---

## 1. 概要と目的

子供向け学習アプリ「Kids LearnQuest」において、保護者が曜日ごと（月曜日〜日曜日）にお子様の学習目標（ノルマ）を柔軟にカスタマイズできる機能を導入する。
学校の宿題の量や習い事、休日のスケジュールに合わせて、「月曜日は数学と英語」「火曜日は国語と理科」「土日は軽め」など、目標タイプ（問題数重視 / 時間重視 / 科目別）、目標値（問題数 / 時間 / 各科目ノルマ）、ご褒美メッセージを曜日ごとに最適化できるようにする。

---

## 2. 要件仕様

1. **柔軟なカスタマイズ性**:
   - 各曜日ごとに独立して「目標タイプ（`total_count` / `total_time` / `subject_specific`）」、「目標値（問題数 / 時間 / 各科目ノルマ）」、「ご褒美」を設定可能。
2. **後方互換性とフォールバック**:
   - 既存の `dailyGoal`（基本目標）を保持し、曜日別スケジュールが無効（OFF）または未設定の曜日には基本目標を自動適用する。
   - 既存のDB（`db.json`）、既存API、既存テストを破壊しない。
3. **直感的な設定UI**:
   - ウィザード上部に「📅 曜日ごとにノルマを変える」トグルを配置。
   - ONの場合、月〜日の7曜日タブを表示し、各曜日の目標を3ステップウィザード（タイプ選択 ➔ 目標値 ➔ ご褒美）で編集。
   - 入力負担を軽減するコピー補助ボタン（「基本目標からコピー」「平日に一括コピー」「全曜日にコピー」）を提供。
4. **学習進捗・ノルマ表示の連動**:
   - 当日の曜日に応じた目標を自動判定（`getEffectiveDailyGoal`）し、お子様向けトップ画面（`App.tsx`）および保護者ダッシュボード（`ParentDashboard.tsx`）に正しく反映。

---

## 3. データ構造 (`src/types/index.ts`)

```typescript
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeeklySchedule {
  enabled: boolean; // 曜日別スケジュールが有効か
  days?: Partial<Record<DayOfWeek, DailyGoal>>; // 曜日ごとの個別DailyGoal
}

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  grade: number;
  dailyGoal: DailyGoal;             // 基本・デフォルト目標（未設定曜日に適用）
  weeklySchedule?: WeeklySchedule;  // 曜日別スケジュール設定
  equippedAvatar?: string;
  pin?: string;
}
```

---

## 4. 判定ロジック & ヘルパー (`src/utils/goalEvaluator.ts`)

### 4.1 今日の目標取得ヘルパー `getEffectiveDailyGoal`
```typescript
export const getEffectiveDailyGoal = (profile: UserProfile, targetDate?: Date): DailyGoal => {
  if (!profile.weeklySchedule?.enabled || !profile.weeklySchedule.days) {
    return profile.dailyGoal;
  }
  const date = targetDate || new Date();
  const dayIndex = date.getDay(); // 0: 日, 1: 月, 2: 火, 3: 水, 4: 木, 5: 金, 6: 土
  const dayMap: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayMap[dayIndex];

  return profile.weeklySchedule.days[todayKey] || profile.dailyGoal;
};
```

---

## 5. UI / UX 設計

### 5.1 `GoalSettingWizard.tsx`
- **上部**:
  - `[ ] 📅 曜日ごとにノルマを変える (ON / OFF)` トグルスイッチ
- **トグル OFF 時**:
  - 基本の目標（毎日適用）を編集。
- **トグル ON 時**:
  - 曜日選択タブ: `[月] [火] [水] [木] [金] [土] [日]`（本日の曜日に「今日」バッジ表示）
  - 各曜日のタブをクリックすると、その曜日の `DailyGoal` 編集フォームに切り替え。
  - アクションボタン群:
    - 📋「基本目標をコピー」
    - 📋「平日にコピー (月〜金)」
    - 📋「全曜日にコピー」
  - 「保存」ボタン押下で、`dailyGoal` および `weeklySchedule` をプロファイルに一括保存。

### 5.2 `ParentDashboard.tsx`
- 保存処理: `handleSaveGoal` を拡張し、`dailyGoal` と `weeklySchedule` の両方を更新保存。
- 進捗可視化: `getEffectiveDailyGoal(targetProfile)` を用いて「本日の目標進捗」を表示。曜日バッジ（例: `[📅 火曜日の目標]`）を表示。

### 5.3 `App.tsx`
- `getEffectiveDailyGoal(activeProfile)` を用いてノルマ判定・進捗バー・科目別バッジを表示。
- タイトルに本日の曜日を表示（例: `きょうのノルマ (火曜日: 0 / 2 教科達成)`）。

---

## 6. テスト計画

1. **データ型 & ヘルパーテスト** (`src/__tests__/weekly_schedule_evaluator.test.ts`):
   - `weeklySchedule` が無効 / 未設定時は基本 `dailyGoal` を返すこと。
   - `enabled: true` で月曜日に月曜専用 `DailyGoal` を正しく取得できること。
   - 未設定の曜日には基本 `dailyGoal` がフォールバックされること。
2. **ウィザードUIテスト** (`src/__tests__/goal_wizard.test.tsx`):
   - 曜日別トグルの切り替えで曜日タブが表示されること。
   - 曜日切り替えやコピーボタンで値が反映されること。
   - 保存時に `weeklySchedule` を含めてコールバックされること。
3. **ダッシュボード＆メイン画面統合テスト**:
   - 曜日に合わせたノルマが正しく表示されること。
