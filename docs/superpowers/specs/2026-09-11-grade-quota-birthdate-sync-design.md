# 学年別ノルマ判定制限および生年月日自動学年同期 設計仕様書

## 1. 概要と背景

### 課題
1. **別学年の問題によるノルマ達成**:
   現在、クイズやテストを解いた際、問題の学年（`grade`）が区別されずに `DailyReport` に集計されるため、例えば小学3年生のお子様が小学1年生の計算問題を解くだけで「きょうのノルマ」が達成できてしまう。
2. **手動学年設定の課題**:
   学年がプロフィールの固定値として手動管理されているため、新年度を迎えても自動で進級せず、またお子様自身で学年を下げて簡単な問題でノルマを達成するリスクがある。

### 目的
1. **ノルマ判定の適正化**:
   お子様の現在の学年以上の問題（現学年＋先取り学習）のみを「きょうのノルマ」達成カウント対象とし、低学年の問題はノルマ対象から除外する。
2. **生年月日に基づく学年自動計算・自動進級**:
   日本の学校教育法・年齢計算ニ関スル法律（4月2日〜翌年4月1日生まれが同学年、4月1日進級）に基づき、生年月日から現在の学年を自動計算・進級更新する。
3. **学年変更の保護者管理**:
   学年や生年月日の手動変更は、保護者マスターパスワード認証を通過した管理者のみに限定する。

---

## 2. データモデルの拡張 (`src/types/index.ts`)

### 2.1 `UserProfile`
```typescript
export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  birthDate?: string; // YYYY-MM-DD (例: "2017-05-15")
  grade?: number;     // 1〜9 (小1〜中3)
  pin?: string;
  semesterSystem?: SemesterSystem;
  dailyGoal?: DailyGoal;
  weeklySchedule?: WeeklySchedule;
  stats: UserStats;
}
```

### 2.2 `QuizSession`
```typescript
export interface QuizSession {
  id?: string;
  subject: Subject;
  grade?: number;     // 🌟 解いた問題の学年 (1〜9)
  unitName?: string;
  sessionType?: 'quiz' | 'exam';
  questionsAttempted: number;
  questionsCorrect: number;
  durationMinutes: number;
  durationSeconds?: number;
  timestamp: string;
  questionRecords?: SessionQuestionRecord[];
}
```

---

## 3. 日本の学校制度に準拠した学年計算ユーティリティ (`src/utils/gradeCalculator.ts`)

### 3.1 仕様詳細
日本の学校制度（学校教育法第17条、年齢計算ニ関スル法律）:
- 4月1日生まれは、法律上「誕生日の前日（3月31日）終了時」に満年齢に達するため、**前年度（1学年上）**となる。
- したがって、**4月2日生まれ 〜 翌年4月1日生まれ**が同一学年となる。
- 学年の切り替え（進級）は毎年**4月1日**。

### 3.2 関数シグネチャ
```typescript
export interface GradeCalculationResult {
  grade: number;         // 1〜9 (小1〜中3), 0: 未就学, 10: 高校生以上
  label: string;         // "小学3年", "未就学", "高校生以上" など
  isSchoolAge: boolean;  // 小1〜中3の義務教育期間内かどうか
}

export const calculateGradeFromBirthDate = (
  birthDateStr: string,
  baseDate: Date = new Date()
): GradeCalculationResult;

export const formatGradeLabel = (grade: number): string;
```

### 3.3 自動進級ロジック
- プロフィール読み込み時（`storage.getProfiles()`, `App.tsx` の初期化・プロファイル選択時）に、`profile.birthDate` が存在する場合：
  - 現在日付に基づく学年を算出。
  - プロフィールの現在の `grade` と異なる場合は自動的に `grade` を更新し、ローカルおよびサーバーへ永続化する。

---

## 4. ノルマ達成判定の学年フィルタリング (`src/utils/goalEvaluator.ts`)

### 4.1 仕様詳細
- ノルマ判定関数 `checkIsDailyGoalAchieved` および `getGoalProgress` に、第3引数として `profileGrade?: number` を追加。
- `report.sessions` が存在し、かつ `profileGrade` が渡されている場合：
  - `sess.grade >= profileGrade` を満たすセッションのみを抽出してノルマ対象レポート（`filteredReport`）を再集計。
  - 各セッションの `questionsAttempted`、`questionsCorrect`、`durationMinutes`、`subject`、`subjectBreakdown` を再合算。
- `profileGrade` が未指定の場合や、セッション記録のない旧レポートの場合は、従来の全体集計値へ安全にフォールバック。

### 4.2 ユーザー体験
- 小3のお子様が小1の問題を解いた場合：
  - ノルマ進捗バー・問題数カウントは進まない。
  - リザルト画面でコイン・経験値・SRS更新・復習ノートは通常通り獲得可能。
  - 親ダッシュボードの総学習時間・解いた問題数には全問が正しく反映される。
- 小3のお子様が小3または小4（先取り）の問題を解いた場合：
  - ノルマ進捗バーが進み、条件を満たせば「今日のノルマ達成！」モーダルが表示される。

---

## 5. UI とセキュリティ（保護者認証）

### 5.1 `ProfileSelectorModal.tsx`
- **一般モード（お子様自身の編集）**:
  - 名前・アイコン・暗証番号（PIN）の変更は許可。
  - 生年月日および学年フィールドは**読み取り専用（ロック表示）**。
  - 「※学年や生年月日の変更は保護者パスワードが必要です」という説明文を表示。
- **保護者モード（保護者認証経由または保護者解除時）**:
  - 生年月日の入力（日付ピッカー）が可能。
  - 生年月日を入力すると、自動計算された学年が自動選択される。
  - 手動での学年上書き変更も可能。

### 5.2 `ParentDashboard.tsx`
- プロフィール管理エリアで、各プロフィールの生年月日・現在の学年を確認可能。

---

## 6. テスト・検証計画

1. **`src/__tests__/gradeCalculator.test.ts`**:
   - 早生まれ境界値テスト（2017-04-01生まれは小4、2017-04-02生まれは小3：2026年度基準）。
   - 4月1日での年度更新（進級）テスト。
   - 未就学児・高校生以上の境界値テスト。
2. **`src/__tests__/goal_evaluation_grade_filter.test.ts`**:
   - 現学年（例: 小3）の問題でノルマ達成できること。
   - 低学年（例: 小1）の問題のみではノルマ達成できないこと。
   - 高学年（例: 小4、先取り学習）の問題でノルマ達成できること。
   - セッションのない過去レポートでも互換性を維持すること。
3. **`src/__tests__/profile_birthdate_security.test.tsx`**:
   - お子様モードでの学年・生年月日編集不可。
   - 保護者パスワード認証による生年月日・学年変更。
4. **統合テスト**:
   - `wsl --cd /home/dev/workspace/kids-learning-app npm test`
   - `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
