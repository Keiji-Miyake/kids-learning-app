# 学年別ノルマ判定制限および生年月日自動学年同期 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** お子様の現在学年以上の問題（現学年＋先取り）のみをノルマ達成の対象とし、生年月日に基づく自動進級および保護者認証による学年管理を実現する。

**Architecture:** 
1. `src/types/index.ts` を拡張し、`UserProfile` に `birthDate`、`QuizSession` に `grade` を追加。
2. 日本の学校制度に準拠した `src/utils/gradeCalculator.ts` を新設し、早生まれ境界と4月1日進級を自動算出。
3. `src/utils/goalEvaluator.ts` に学年フィルタリングを導入し、`sess.grade >= profileGrade` の問題のみノルマ評価対象とする。
4. `ProfileSelectorModal.tsx` で生年月日の入力UIを追加し、一般編集で学年・生年月日をロック、保護者認証時のみ変更可能とする。

**Tech Stack:** React, TypeScript, Vitest / Testing Library, LocalStorage / Express API

## Global Constraints
- テストコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
- リントコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
- 言語ルール: ユーザー向けメッセージ、コード内コメント、テスト項目名は日本語を使用すること。

---

### Task 1: データモデル拡張と生年月日による学年計算ユーティリティの実装 (TDD)

**Files:**
- Create: `src/utils/gradeCalculator.ts`
- Create: `src/__tests__/gradeCalculator.test.ts`
- Modify: `src/types/index.ts`
- Modify: `server.js`

**Interfaces:**
- Consumes: `src/types/index.ts`
- Produces: `calculateGradeFromBirthDate(birthDateStr: string, baseDate?: Date): GradeCalculationResult`, `formatGradeLabel(grade: number): string`

- [ ] **Step 1: `src/types/index.ts` および `server.js` に `birthDate` と `QuizSession.grade` を追加**

`src/types/index.ts`:
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

export interface QuizSession {
  id?: string;
  subject: Subject;
  grade?: number;     // 解いた問題の学年 (1〜9)
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

- [ ] **Step 2: 学年計算ユーティリティのテストを作成（失敗するテスト）**

`src/__tests__/gradeCalculator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateGradeFromBirthDate, formatGradeLabel } from '../utils/gradeCalculator';

describe('gradeCalculator: 日本の学校教育法に基づく学年判定テスト', () => {
  // 基準日: 2026年9月11日（2026年度中）
  const baseDate = new Date('2026-09-11T00:00:00Z');

  it('2017年4月2日生まれは2026年9月時点で小学3年生（8〜9歳）', () => {
    const result = calculateGradeFromBirthDate('2017-04-02', baseDate);
    expect(result.grade).toBe(3);
    expect(result.label).toBe('小学3年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('2018年4月1日生まれ（早生まれ）は2026年9月時点で小学3年生', () => {
    const result = calculateGradeFromBirthDate('2018-04-01', baseDate);
    expect(result.grade).toBe(3);
    expect(result.label).toBe('小学3年');
  });

  it('2018年4月2日生まれは2026年9月時点で小学2年生', () => {
    const result = calculateGradeFromBirthDate('2018-04-02', baseDate);
    expect(result.grade).toBe(2);
    expect(result.label).toBe('小学2年');
  });

  it('2011年4月2日生まれは2026年9月時点で中学3年生（grade 9）', () => {
    const result = calculateGradeFromBirthDate('2011-04-02', baseDate);
    expect(result.grade).toBe(9);
    expect(result.label).toBe('中学3年');
  });

  it('2027年4月1日に進級し、2017年4月2日生まれは小学4年生になる', () => {
    const nextFiscalYear = new Date('2027-04-01T00:00:00Z');
    const result = calculateGradeFromBirthDate('2017-04-02', nextFiscalYear);
    expect(result.grade).toBe(4);
    expect(result.label).toBe('小学4年');
  });

  it('未就学児（未達）の場合は grade: 0, label: 未就学', () => {
    const result = calculateGradeFromBirthDate('2022-05-01', baseDate);
    expect(result.grade).toBe(0);
    expect(result.label).toBe('未就学');
    expect(result.isSchoolAge).toBe(false);
  });

  it('高校生以上（義務教育修了）の場合は grade: 10, label: 高校生以上', () => {
    const result = calculateGradeFromBirthDate('2010-01-15', baseDate);
    expect(result.grade).toBe(10);
    expect(result.label).toBe('高校生以上');
    expect(result.isSchoolAge).toBe(false);
  });
});
```

- [ ] **Step 3: テストを実行して失敗することを確認**
- [ ] **Step 4: `src/utils/gradeCalculator.ts` を実装**
- [ ] **Step 5: テストを実行して PASS することを確認**
- [ ] **Step 6: コミット**

---

### Task 2: ノルマ判定における学年フィルタリングの実装 (TDD)

**Files:**
- Modify: `src/utils/storage.ts`
- Modify: `src/utils/goalEvaluator.ts`
- Modify: `src/App.tsx`
- Create: `src/__tests__/goal_evaluation_grade_filter.test.ts`

**Interfaces:**
- Consumes: `QuizSession.grade`, `UserProfile.grade`, `calculateGradeFromBirthDate`
- Produces: `checkIsDailyGoalAchieved(goal, report, profileGrade)`, `getGoalProgress(goal, report, profileGrade)`

- [ ] **Step 1: 学年フィルタリングを検証するテストを作成（失敗するテスト）**

`src/__tests__/goal_evaluation_grade_filter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('学年別ノルマ達成フィルタリングテスト', () => {
  const goal: DailyGoal = {
    targetQuestions: 5,
    targetMinutes: 10,
    rewardText: 'ご褒美',
    goalType: 'total_count'
  };

  it('小学3年生のお子様が小学1年生の問題（低学年）を5問解いてもノルマ達成にならない', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 1, // 低学年の問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    // profileGrade = 3 を指定した場合
    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(false);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.percent).toBe(0);
    expect(progress.isAchieved).toBe(false);
  });

  it('小学3年生のお子様が小学3年生の問題（現学年）を5問解いた場合はノルマ達成になる', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 3, // 現学年の問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(true);

    const progress = getGoalProgress(goal, report, 3);
    expect(progress.percent).toBe(100);
    expect(progress.isAchieved).toBe(true);
  });

  it('小学3年生のお子様が小学4年生の問題（先取り学習）を5問解いた場合もノルマ達成になる', () => {
    const report: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 },
      sessions: [
        {
          subject: 'math',
          grade: 4, // 先取り問題
          questionsAttempted: 5,
          questionsCorrect: 5,
          durationMinutes: 10,
          timestamp: new Date().toISOString()
        }
      ]
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, report, 3);
    expect(isAchieved).toBe(true);
  });

  it('セッション情報がない古いレポートの場合は後方互換で全体数で判定する', () => {
    const legacyReport: DailyReport = {
      date: '2026-09-11',
      questionsAttempted: 5,
      questionsCorrect: 5,
      subjectMinutes: { math: 10, japanese: 0, science: 0, social: 0, english: 0 }
    };

    const isAchieved = checkIsDailyGoalAchieved(goal, legacyReport, 3);
    expect(isAchieved).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**
- [ ] **Step 3: `src/utils/storage.ts` の `addReportData` で `grade` をセッションに記録するよう修正**
- [ ] **Step 4: `src/App.tsx` の `handleFinishQuiz` で解いた学年（`grade`）を渡すよう修正**
- [ ] **Step 5: `src/utils/goalEvaluator.ts` に学年フィルタリング関数を追加・統合**
- [ ] **Step 6: テストを実行して PASS することを確認**
- [ ] **Step 7: コミット**

---

### Task 3: プロフィール編集・追加における生年月日入力と保護者権限管理 (TDD)

**Files:**
- Modify: `src/components/ProfileSelectorModal.tsx`
- Modify: `src/utils/storage.ts`
- Create: `src/__tests__/profile_birthdate_security.test.tsx`

**Interfaces:**
- Consumes: `calculateGradeFromBirthDate`, `storage.verifyParentPassword`
- Produces: `ProfileSelectorModal` 生年月日入力、保護者認証ロック

- [ ] **Step 1: プロフィールの生年月日・学年編集セキュリティテストを作成（失敗するテスト）**

`src/__tests__/profile_birthdate_security.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';
import { storage } from '../utils/storage';

describe('ProfileSelectorModal 生年月日・学年編集の保護者セキュリティテスト', () => {
  const mockProfiles = [
    {
      id: 'profile-child',
      name: 'たろう',
      avatarEmoji: '👦',
      grade: 3,
      birthDate: '2017-05-10',
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 1, lastActiveDate: null,
        unlockedBadges: [], equippedAvatar: { base: 'default', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    }
  ];

  beforeEach(() => {
    vi.spyOn(storage, 'getProfiles').mockReturnValue(mockProfiles as any);
    vi.spyOn(storage, 'getActiveProfileId').mockReturnValue('profile-child');
  });

  it('通常のお子様編集モーダルでは、学年と生年月日の入力欄が無効化（disabled）されていること', async () => {
    render(<ProfileSelectorModal onSelectProfile={vi.fn()} onClose={vi.fn()} />);

    // 編集ボタンをクリック
    const editBtn = screen.getByTitle('プロフィールを編集');
    fireEvent.click(editBtn);

    // 生年月日および学年セレクトボックスが disabled であること
    const gradeSelect = screen.getByLabelText(/学年/i);
    expect(gradeSelect).toBeDisabled();

    const birthDateInput = screen.getByLabelText(/生年月日/i);
    expect(birthDateInput).toBeDisabled();

    // 保護者認証の案内が表示されていること
    expect(screen.getByText(/学年や生年月日の変更は保護者パスワードが必要です/i)).toBeInTheDocument();
  });

  it('保護者パスワード認証を解除すると、学年と生年月日の編集が可能になること', async () => {
    vi.spyOn(storage, 'verifyParentPasswordAsync').mockResolvedValue(true);
    render(<ProfileSelectorModal onSelectProfile={vi.fn()} onClose={vi.fn()} />);

    // 編集画面を開く
    fireEvent.click(screen.getByTitle('プロフィールを編集'));

    // 「保護者ロック解除」ボタンをクリック
    const unlockBtn = screen.getByText(/保護者ロックを解除して変更/i);
    fireEvent.click(unlockBtn);

    // パスワード入力
    const passwordInput = screen.getByPlaceholderText(/保護者パスワード/i);
    fireEvent.change(passwordInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/解除する/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/生年月日/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/学年/i)).not.toBeDisabled();
    });
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**
- [ ] **Step 3: `ProfileSelectorModal.tsx` に生年月日入力欄、自動学年同期、保護者ロック解除UIを実装**
- [ ] **Step 4: プロファイル取得時に `birthDate` に応じた学年自動進級ロジックを `storage.ts` に組み込み**
- [ ] **Step 5: テストを実行して PASS することを確認**
- [ ] **Step 6: コミット**

---

### Task 4: 全体動作検証・リグレッションテスト・リント検証

- [ ] **Step 1: 全テスト実行**
`wsl --cd /home/dev/workspace/kids-learning-app npm test`
- [ ] **Step 2: リント検証**
`wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
- [ ] **Step 3: 最終コミット**
