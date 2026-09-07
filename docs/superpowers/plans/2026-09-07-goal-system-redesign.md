# 目標設定システム拡張とUX改善 実装計画 (Goal System Redesign Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 子供向け学習支援アプリ「Kids LearnQuest」において、保護者が子供の目標（ノルマ）を直感的に設定・確認できるよう、目的選択型ウィザードUI、問題数・時間・科目別の柔軟な目標達成判定ロジック、およびダッシュボード進捗可視化を実装する。

**Architecture:**
- 型定義とデータモデル（`GoalType`, `SubjectGoal`, `QuizSession`, `DailyReport`）を拡張。
- ノルマ判定・進捗算出を純粋関数（`goalEvaluator.ts`）に集約し、TDDで堅牢性を担保。
- 設定画面は独立した3ステップ目的選択型ウィザード（`GoalSettingWizard.tsx`）に分離。
- 進捗可視化（進捗バー＆科目別進捗カード）は共通の進捗計算ヘルパーを用いて保護者ダッシュボードとお子様トップ画面の両方に反映。

**Tech Stack:** React 19, TypeScript, Express, Vitest, Testing Library

## Global Constraints
- 日本語対応: UI上のラベルやメッセージはすべて日本語で統一する。
- 既存データ互換性: `db.json` の既存構造や旧形式の `dailyGoal` を壊さず、欠落時は安全にフォールバックする。
- テスト実行環境: WSL環境（`wsl --cd /home/dev/workspace/kids-learning-app npm test`）で実行。

---

### Task 1: データ構造の拡張と既存データ救済

**Files:**
- Modify: `src/types/index.ts`
- Modify: `server.js`
- Test: `src/__tests__/types_and_server_persistence.test.ts`

**Interfaces:**
- Consumes: `Subject` from `src/types/index.ts`
- Produces: `GoalType`, `SubjectGoal`, `QuizSession`, updated `DailyGoal`, updated `DailyReport` in `src/types/index.ts`

- [ ] **Step 1: Write failing test for server data persistence & profile fallback**

```typescript
// src/__tests__/types_and_server_persistence.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
// @ts-ignore
import app from '../../server.js';
import type { GoalType, DailyGoal } from '../types';

describe('Goal types and Server persistence test', () => {
  it('should accept extended dailyGoal with goalType and subjectGoals targetMinutes', async () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'テストご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 },
        japanese: { targetQuestions: 3, targetMinutes: 5 }
      }
    };
    expect(goal.goalType).toBe('subject_specific');
    expect(goal.subjectGoals?.math?.targetMinutes).toBe(10);
  });

  it('GET /api/profiles should return valid array even if db.json is missing fields', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (types not defined yet)**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/types_and_server_persistence.test.ts`
Expected: FAIL due to missing type exports or properties

- [ ] **Step 3: Update `src/types/index.ts` and `server.js`**

In `src/types/index.ts`:
```typescript
export type GoalType = 'total_count' | 'total_time' | 'subject_specific';

export interface SubjectGoal {
  targetQuestions: number;
  targetMinutes: number;
}

export interface DailyGoal {
  targetQuestions: number;
  targetMinutes: number;
  rewardText: string;
  goalType?: GoalType;
  targetSubject?: Subject | 'all';
  targetUnitName?: string | 'all';
  subjectGoals?: Partial<Record<Subject, SubjectGoal>>;
}

export interface QuizSession {
  subject: Subject;
  questionsAttempted: number;
  questionsCorrect: number;
  durationMinutes: number;
  timestamp: string;
}

export interface DailyReport {
  date: string;
  subjectMinutes: Record<Subject, number>;
  questionsAttempted: number;
  questionsCorrect: number;
  totalQuestions?: number;
  subjectBreakdown?: Partial<Record<Subject, { total: number; correct?: number }>>;
  sessions?: QuizSession[];
}
```

In `server.js`: Ensure `readDB()` guards `profiles`, `stats`, `reviews`, `reports`, `progress` so tests never crash with undefined profiles.

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/types_and_server_persistence.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts server.js src/__tests__/types_and_server_persistence.test.ts
git commit -m "feat: extend daily goal and report types, improve server db guards"
```

---

### Task 2: 目標達成判定と進捗計算ロジックの拡張 (TDD)

**Files:**
- Modify: `src/utils/goalEvaluator.ts`
- Test: `src/__tests__/goal_evaluation_extended.test.ts`

**Interfaces:**
- Consumes: `DailyGoal`, `DailyReport`, `Subject` from `src/types/index.ts`
- Produces: `checkIsDailyGoalAchieved`, `getSubjectProgressSummary`, `getGoalProgress`, `GoalOverallProgress`

- [ ] **Step 1: Write failing tests covering all goal types and edge cases**

```typescript
// src/__tests__/goal_evaluation_extended.test.ts
import { describe, it, expect } from 'vitest';
import { checkIsDailyGoalAchieved, getSubjectProgressSummary, getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('Extended Daily Goal Evaluation Tests', () => {
  const mockReport: DailyReport = {
    date: '2026-09-07',
    questionsAttempted: 5,
    questionsCorrect: 5,
    totalQuestions: 5,
    subjectMinutes: { math: 6, japanese: 0, science: 0, social: 0, english: 0 },
    subjectBreakdown: {
      math: { total: 5, correct: 5 }
    }
  };

  it('goalType="total_time" checks totalMinutes vs targetMinutes', () => {
    const goalPass: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 5,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };
    expect(checkIsDailyGoalAchieved(goalPass, mockReport)).toBe(true);

    const goalFail: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_time'
    };
    expect(checkIsDailyGoalAchieved(goalFail, mockReport)).toBe(false);
  });

  it('goalType="subject_specific" with both questions and minutes requires both to pass', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 } // math has 5 questions (pass) but 6 mins (fail)
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(false);
  });

  it('goalType="subject_specific" passes when both questions and minutes are met', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 5 } // math has 5 questions and 6 mins (both pass)
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(true);
  });

  it('goalType="subject_specific" with only targetMinutes passes if time met', () => {
    const goal: DailyGoal = {
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'subject_specific',
      subjectGoals: {
        math: { targetQuestions: 0, targetMinutes: 5 }
      }
    };
    expect(checkIsDailyGoalAchieved(goal, mockReport)).toBe(true);
  });

  it('getGoalProgress returns overall percentage and subject progress items', () => {
    const goal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      goalType: 'total_count'
    };
    const progress = getGoalProgress(goal, mockReport);
    expect(progress.percent).toBe(50); // 5/10
    expect(progress.currentLabel).toBe('5 / 10 問');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/goal_evaluation_extended.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement logic in `src/utils/goalEvaluator.ts`**

Implement:
- Handle `goalType === 'total_time'`
- Handle `goalType === 'subject_specific'` checking `targetQuestions` and `targetMinutes` per subject
- Implement `getGoalProgress(goal, reports)` returning formatted labels and percentage.

- [ ] **Step 4: Run test to verify it passes**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/goal_evaluation_extended.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/goalEvaluator.ts src/__tests__/goal_evaluation_extended.test.ts
git commit -m "feat: implement extended goal evaluator with total_time and dual-metric subject goals"
```

---

### Task 3: クイズ完了時の学習セッション履歴（sessions）記録

**Files:**
- Modify: `src/utils/storage.ts`
- Modify: `src/App.tsx`
- Test: `src/__tests__/session_report_storage.test.ts`

**Interfaces:**
- Consumes: `QuizSession`, `DailyReport` from `src/types/index.ts`
- Produces: `storage.addReportData(subject, correctCount, totalCount, timeSpentSeconds, profileId)`

- [ ] **Step 1: Write failing test for session recording**

```typescript
// src/__tests__/session_report_storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { Subject } from '../types';

describe('Quiz Session Report Storage Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records QuizSession in DailyReport.sessions and updates subjectMinutes & subjectBreakdown', () => {
    const profileId = 'test-profile-1';
    storage.addReportData('math', 5, 5, 120, profileId); // 5 questions, 5 correct, 120s (2m)

    const reports = storage.getReports(profileId);
    expect(reports.length).toBe(1);
    const today = reports[0];
    expect(today.questionsAttempted).toBe(5);
    expect(today.questionsCorrect).toBe(5);
    expect(today.subjectMinutes.math).toBeCloseTo(2, 1);
    expect(today.sessions).toBeDefined();
    expect(today.sessions?.length).toBe(1);
    expect(today.sessions?.[0].subject).toBe('math');
    expect(today.sessions?.[0].durationMinutes).toBeCloseTo(2, 1);
    expect(today.subjectBreakdown?.math?.total).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/session_report_storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/utils/storage.ts` and `src/App.tsx`**

Update `addReportData` signature and implementation in `storage.ts`:
- Support passing `questionsAttempted` and `questionsCorrect` (or overload for existing callers).
- Push to `todayReport.sessions`.
- Update `todayReport.subjectBreakdown[subjectKey]`.
- Update `App.tsx` where `storage.addReportData` is called in `handleFinishQuiz`.

- [ ] **Step 4: Run test to verify pass**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/session_report_storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.ts src/App.tsx src/__tests__/session_report_storage.test.ts
git commit -m "feat: record quiz sessions and synchronize subjectBreakdown in DailyReport"
```

---

### Task 4: 目的選択型ウィザードコンポーネントの作成

**Files:**
- Create: `src/components/GoalSettingWizard.tsx`
- Modify: `src/components/ParentDashboard.tsx`
- Test: `src/__tests__/goal_wizard.test.ts`

**Interfaces:**
- Consumes: `DailyGoal`, `GoalType`, `UserProfile`, `Subject`
- Produces: `<GoalSettingWizard profile={targetProfile} onSave={handleSaveGoal} />`

- [ ] **Step 1: Write failing test for GoalSettingWizard steps and dynamic forms**

```typescript
// src/__tests__/goal_wizard.test.ts
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalSettingWizard } from '../components/GoalSettingWizard';
import type { UserProfile } from '../types';

describe('GoalSettingWizard Component Tests', () => {
  const mockProfile: UserProfile = {
    id: 'profile-1',
    name: 'たろう',
    avatarEmoji: '👦',
    dailyGoal: {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ゲーム30分OK！'
    },
    stats: {
      level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
      lastActiveDate: null, unlockedBadges: [], ownedItems: [],
      equippedAvatar: { base: 'default', hat: 'none', accessory: 'none', companion: 'none' }
    }
  };

  it('renders Step 1 with 3 goal types and advances to Step 2', () => {
    render(<GoalSettingWizard profile={mockProfile} onSave={() => {}} />);
    expect(screen.getByText(/目標タイプの選択/i)).toBeDefined();
    expect(screen.getByText(/科目別目標/i)).toBeDefined();
    expect(screen.getByText(/合計問題数重視/i)).toBeDefined();
    expect(screen.getByText(/合計時間重視/i)).toBeDefined();

    const nextBtn = screen.getByRole('button', { name: /次へ/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/目標値の設定/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/goal_wizard.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `GoalSettingWizard.tsx` and integrate into `ParentDashboard.tsx`**

- Build 3-step wizard with smooth transitions:
  - Step 1: Goal type cards (subject_specific, total_count, total_time)
  - Step 2: Dynamic fields based on goal type (subject grid or single target)
  - Step 3: Reward text, summary confirmation preview, save button
- Integrate in `ParentDashboard.tsx` replacing the old flat form.

- [ ] **Step 4: Run test to verify pass**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/goal_wizard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/GoalSettingWizard.tsx src/components/ParentDashboard.tsx src/__tests__/goal_wizard.test.ts
git commit -m "feat: create goal setting wizard with 3-step dynamic input"
```

---

### Task 5: ダッシュボード＆メイン画面の進捗可視化改善

**Files:**
- Modify: `src/components/ParentDashboard.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/dashboard_goal_progress_ui.test.ts`

**Interfaces:**
- Consumes: `getGoalProgress` from `src/utils/goalEvaluator.ts`
- Produces: Enhanced goal progress bars and subject-specific badge cards in `ParentDashboard.tsx` & `App.tsx`

- [ ] **Step 1: Write failing test verifying progress display for both screens**

```typescript
// src/__tests__/dashboard_goal_progress_ui.test.ts
import { describe, it, expect } from 'vitest';
import { getGoalProgress } from '../utils/goalEvaluator';
import type { DailyGoal, DailyReport } from '../types';

describe('Goal Progress UI Helper & Display Tests', () => {
  it('formats subject-specific progress for math (both questions & minutes)', () => {
    const goal: DailyGoal = {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ご褒美',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 }
      }
    };
    const report: DailyReport = {
      date: '2026-09-07',
      questionsAttempted: 2,
      questionsCorrect: 2,
      subjectMinutes: { math: 3, japanese: 0, science: 0, social: 0, english: 0 },
      subjectBreakdown: { math: { total: 2, correct: 2 } }
    };

    const progress = getGoalProgress(goal, report);
    const mathProg = progress.subjects.find(s => s.subject === 'math');
    expect(mathProg?.label).toContain('2 / 5問');
    expect(mathProg?.label).toContain('3 / 10分');
    expect(mathProg?.isCompleted).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/dashboard_goal_progress_ui.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `ParentDashboard.tsx` and `App.tsx` to render optimized progress bar and subject cards**

- In `ParentDashboard.tsx`: Add today's goal progress summary card showing overall progress bar and subject progress cards.
- In `App.tsx`: Optimize daily-goal-card to display progress according to goalType:
  - `total_count`: show question count & progress bar
  - `total_time`: show minutes & progress bar
  - `subject_specific`: show subject achievement ratio and individual subject cards (e.g., 算数 2/5問、3/10分)

- [ ] **Step 4: Run test to verify pass**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/dashboard_goal_progress_ui.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ParentDashboard.tsx src/App.tsx src/__tests__/dashboard_goal_progress_ui.test.ts
git commit -m "feat: enhance progress bars and subject goal cards in ParentDashboard and App"
```

---

### Task 6: 総合回帰検証とビルド確認

**Files:**
- Test: All test suites
- Build: Vite production build

- [ ] **Step 1: Run all tests in serial/parallel via WSL command**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
Expected: All test suites PASS

- [ ] **Step 2: Run lint check**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
Expected: No errors

- [ ] **Step 3: Verify build**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run build`
Expected: Build succeeds with 0 errors

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: verify all test suites and production build"
```
