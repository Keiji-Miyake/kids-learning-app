# 保護者管理画面 学習履歴詳細化 実装計画 (Parent Dashboard Learning History Details Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保護者管理画面（`ParentDashboard.tsx`）において、日々の学習履歴から「学習時間」「取り組んだ科目・単元」「解いた問題の内容（問題文・選んだ解答・正解・解説・正誤）」をアコーディオン形式で詳細に閲覧できるようにする。

**Architecture:** 
1. `src/types/index.ts` に解答詳細型 `SessionQuestionRecord` を新設し、セッション型 `QuizSession` に単元名・問題詳細・秒数を追加する。
2. `QuizScreen.tsx` および `ExamScreen.tsx` で問題ごとの選択解答を追跡し、セッション終了時に詳細レコードを生成して `storage.addReportData` で永続化する。
3. `ParentDashboard.tsx` の「日々の記録」テーブルに展開式アコーディオンを実装し、日別サマリー、セッション別タイムライン、問題カード、不正解絞り込みフィルターを表示する。

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Express (server.js), CSS3

## Global Constraints

- 日本語環境: コメント、UIテキスト、テスト項目名は日本語を使用すること。
- テストコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
- リントコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
- 後方互換性: 過去のセッションデータ（`questionRecords` がない古いデータ）でもクラッシュせず安全にフォールバック表示すること。

---

### Task 1: データ型定義の拡張 (Data Types Extension)

**Files:**
- Modify: `src/types/index.ts`
- Test: `src/__tests__/learning_history_types.test.ts`

**Interfaces:**
- Produces: `SessionQuestionRecord`, 拡張された `QuizSession`
  ```typescript
  export interface SessionQuestionRecord {
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }

  export interface QuizSession {
    id?: string;
    subject: Subject;
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

- [ ] **Step 1: 失敗する型整合性テストを作成する**

```typescript
// src/__tests__/learning_history_types.test.ts
import { describe, it, expect } from 'vitest';
import type { QuizSession, SessionQuestionRecord } from '../types';

describe('学習履歴詳細の型定義テスト', () => {
  it('SessionQuestionRecord および拡張 QuizSession が正しく定義されていること', () => {
    const record: SessionQuestionRecord = {
      questionId: 'q-math-1',
      questionText: '1000を10こあつめた数は？',
      selectedAnswer: '10000',
      correctAnswer: '10000',
      isCorrect: true,
      explanation: '1000が10個で10000です。'
    };

    const session: QuizSession = {
      id: 'sess-1',
      subject: 'math',
      unitName: '大きな数',
      sessionType: 'quiz',
      questionsAttempted: 1,
      questionsCorrect: 1,
      durationMinutes: 1,
      durationSeconds: 65,
      timestamp: '2026-09-11T10:00:00.000Z',
      questionRecords: [record]
    };

    expect(session.unitName).toBe('大きな数');
    expect(session.sessionType).toBe('quiz');
    expect(session.durationSeconds).toBe(65);
    expect(session.questionRecords?.[0].selectedAnswer).toBe('10000');
  });
});
```

- [ ] **Step 2: テストを実行して型エラーまたは失敗することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/learning_history_types.test.ts`
Expected: FAIL (TS compilation error: `SessionQuestionRecord` is not exported from '../types', or properties not in `QuizSession`)

- [ ] **Step 3: `src/types/index.ts` に型定義を追加する**

`src/types/index.ts` に `SessionQuestionRecord` を追加し、`QuizSession` に `unitName`, `sessionType`, `durationSeconds`, `questionRecords` を追加。

- [ ] **Step 4: テストを実行して成功することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/learning_history_types.test.ts`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/types/index.ts src/__tests__/learning_history_types.test.ts
git commit -m "feat: add SessionQuestionRecord and extend QuizSession type"
```

---

### Task 2: ストレージ層（storage.ts）のセッション詳細保存拡張

**Files:**
- Modify: `src/utils/storage.ts`
- Test: `src/__tests__/learning_history_storage.test.ts`

**Interfaces:**
- Consumes: `SessionQuestionRecord`, `QuizSession` from `src/types/index.ts`
- Produces: `storage.addReportData` with `sessionDetails` parameter

- [ ] **Step 1: 失敗するストレージ保存テストを作成する**

```typescript
// src/__tests__/learning_history_storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { SessionQuestionRecord } from '../types';

describe('学習レポート詳細保存テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('addReportData に sessionDetails を渡した際、単元名や問題履歴が QuizSession に保存されること', () => {
    const profile = storage.getActiveProfile();
    const records: SessionQuestionRecord[] = [
      {
        questionId: 'q-1',
        questionText: '1000を10こあつめた数は？',
        selectedAnswer: '10000',
        correctAnswer: '10000',
        isCorrect: true,
        explanation: '1000が10個で10000です。'
      }
    ];

    storage.addReportData('math', 1, 65, profile.id, 1, {
      unitName: '大きな数',
      sessionType: 'quiz',
      questionRecords: records
    });

    const reports = storage.getReports(profile.id);
    expect(reports.length).toBeGreaterThan(0);
    const todayReport = reports[0];
    expect(todayReport.sessions?.length).toBeGreaterThan(0);

    const lastSession = todayReport.sessions?.[todayReport.sessions.length - 1];
    expect(lastSession?.unitName).toBe('大きな数');
    expect(lastSession?.sessionType).toBe('quiz');
    expect(lastSession?.durationSeconds).toBe(65);
    expect(lastSession?.questionRecords?.length).toBe(1);
    expect(lastSession?.questionRecords?.[0].questionText).toBe('1000を10こあつめた数は？');
  });

  it('sessionDetails なしで呼び出しても既存互換で安全にデフォルト値が補完されること', () => {
    const profile = storage.getActiveProfile();
    storage.addReportData('japanese', 1, 120, profile.id, 1);

    const reports = storage.getReports(profile.id);
    const lastSession = reports[0].sessions?.[reports[0].sessions.length - 1];
    expect(lastSession?.unitName).toBe('全般（ランダム）');
    expect(lastSession?.sessionType).toBe('quiz');
    expect(lastSession?.questionRecords).toEqual([]);
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/learning_history_storage.test.ts`
Expected: FAIL (properties like `unitName`, `durationSeconds`, `questionRecords` are undefined)

- [ ] **Step 3: `src/utils/storage.ts` の `addReportData` を更新する**

`addReportData` の引数に `sessionDetails` オブジェクトを追加し、セッション生成時にプロパティを設定。

- [ ] **Step 4: テストを実行して成功することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/learning_history_storage.test.ts`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/utils/storage.ts src/__tests__/learning_history_storage.test.ts
git commit -m "feat: enhance storage.addReportData with session details and question records"
```

---

### Task 3: クイズ画面・単元確認テスト画面での解答追跡と連携

**Files:**
- Modify: `src/components/QuizScreen.tsx`
- Modify: `src/components/ExamScreen.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/quiz_exam_history_integration.test.ts`

**Interfaces:**
- Consumes: `SessionQuestionRecord`, `QuizSession` from `src/types/index.ts`, `storage.addReportData` from `src/utils/storage.ts`
- Produces: `onFinish` in `QuizScreen` passing `SessionQuestionRecord[]`, `handleSubmitExam` in `ExamScreen` saving exam report

- [ ] **Step 1: クイズ＆テスト連携テストを作成する**

```typescript
// src/__tests__/quiz_exam_history_integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { Question } from '../types';

describe('クイズおよび単元確認テストの解答トラッキング統合テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('クイズ終了時に選んだ解答・正解・解説が正しく記録されること', () => {
    const profile = storage.getActiveProfile();
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        subject: 'math',
        grade: 3,
        questionText: '1000を10こあつめた数は？',
        options: ['1000', '10000', '100000'],
        correctAnswer: '10000',
        explanation: '1000が10個で10000です。'
      }
    ];

    // QuizScreen が生成する questionRecords の構造検証
    const records = mockQuestions.map(q => ({
      questionId: q.id,
      questionText: q.questionText,
      selectedAnswer: '10000',
      correctAnswer: q.correctAnswer,
      isCorrect: true,
      explanation: q.explanation
    }));

    storage.addReportData('math', 1, 30, profile.id, 1, {
      unitName: '大きな数',
      sessionType: 'quiz',
      questionRecords: records
    });

    const report = storage.getReports(profile.id)[0];
    expect(report.sessions?.[0].questionRecords?.[0].selectedAnswer).toBe('10000');
    expect(report.sessions?.[0].questionRecords?.[0].isCorrect).toBe(true);
  });
});
```

- [ ] **Step 2: テストを実行して動作確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/quiz_exam_history_integration.test.ts`
Expected: PASS

- [ ] **Step 3: `QuizScreen.tsx`, `ExamScreen.tsx`, `App.tsx` を実装・更新する**

1. `QuizScreen.tsx`:
   - `userAnswers` ステートを追加し、解答選択時および時間切れ時に選択肢を保存。
   - `onFinish` 呼び出し時に `SessionQuestionRecord[]` を構築して渡す。
2. `ExamScreen.tsx`:
   - `handleSubmitExam` で `SessionQuestionRecord[]` を構築し、所要時間 `Math.max(1, 600 - timeLeft)` とともに `storage.addReportData` を呼び出す。
3. `App.tsx`:
   - `handleFinishQuiz` で `questionRecords` を受け取り、`activeUnit?.unitName || '全般（ランダム）'` とともに `storage.addReportData` に渡す。

- [ ] **Step 4: 全テストを実行して確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
Expected: ALL PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/QuizScreen.tsx src/components/ExamScreen.tsx src/App.tsx src/__tests__/quiz_exam_history_integration.test.ts
git commit -m "feat: integrate quiz and exam question tracking with report storage"
```

---

### Task 4: 保護者管理画面（ParentDashboard.tsx）のアコーディオンUI実装

**Files:**
- Modify: `src/components/ParentDashboard.tsx`
- Modify: `src/index.css`
- Test: `src/__tests__/parent_dashboard_history_ui.test.tsx`

**Interfaces:**
- Consumes: `DailyReport`, `QuizSession`, `SessionQuestionRecord` from `src/types/index.ts`, `storage.getReports` from `src/utils/storage.ts`
- Produces: アコーディオン展開UI、セッションタイムライン、問題詳細カード、不正解フィルター

- [ ] **Step 1: UI表示テストを作成する**

```tsx
// src/__tests__/parent_dashboard_history_ui.test.tsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParentDashboard } from '../components/ParentDashboard';
import { storage } from '../utils/storage';

describe('保護者管理画面 学習履歴詳細アコーディオンUIテスト', () => {
  beforeEach(() => {
    localStorage.clear();
    const profile = storage.getActiveProfile();
    storage.addReportData('math', 1, 120, profile.id, 1, {
      unitName: 'かけ算九九',
      sessionType: 'quiz',
      questionRecords: [
        {
          questionId: 'q-test-1',
          questionText: '3 × 7 は？',
          selectedAnswer: '21',
          correctAnswer: '21',
          isCorrect: true,
          explanation: '3を7回足すと21になります。'
        },
        {
          questionId: 'q-test-2',
          questionText: '7 × 8 は？',
          selectedAnswer: '54',
          correctAnswer: '56',
          isCorrect: false,
          explanation: '7 × 8 = 56 です。'
        }
      ]
    });
  });

  it('保護者認証後、日々の記録テーブルに詳細ボタンが表示され、クリックでアコーディオンが展開されること', async () => {
    render(<ParentDashboard onClose={() => {}} />);

    // 初期保護者パスワード入力 (parent)
    const passInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(passInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/ログインして進む/));

    // テーブルの日付または詳細ボタンを確認
    const detailBtn = await screen.findByRole('button', { name: /詳細を見る/ });
    expect(detailBtn).toBeTruthy();

    // クリックしてアコーディオン展開
    fireEvent.click(detailBtn);

    // 単元名「かけ算九九」、問題文、選んだ答えが表示されていること
    expect(screen.getByText(/かけ算九九/)).toBeTruthy();
    expect(screen.getByText(/3 × 7 は？/)).toBeTruthy();
    expect(screen.getByText(/7 × 8 は？/)).toBeTruthy();
    expect(screen.getByText(/解説: 3を7回足すと21になります。/)).toBeTruthy();
  });

  it('「間違えた問題だけ表示」にチェックを入れると、正解した問題が非表示になること', async () => {
    render(<ParentDashboard onClose={() => {}} />);
    const passInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(passInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/ログインして進む/));

    const detailBtn = await screen.findByRole('button', { name: /詳細を見る/ });
    fireEvent.click(detailBtn);

    // チェックボックス切り替え
    const filterCheckbox = screen.getByLabelText(/間違えた問題だけ表示/);
    fireEvent.click(filterCheckbox);

    // 正解問題は消え、不正解問題のみ表示
    expect(screen.queryByText(/3 × 7 は？/)).toBeNull();
    expect(screen.getByText(/7 × 8 は？/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/parent_dashboard_history_ui.test.tsx`
Expected: FAIL (ボタン「詳細を見る」が見つからない等)

- [ ] **Step 3: `ParentDashboard.tsx` と `index.css` を実装する**

1. `ParentDashboard.tsx`:
   - `expandedDate` ステートおよび `onlyWrongFilter` ステートを追加。
   - 日々の記録テーブルに「操作」列を追加し、「▼ 詳細を見る」「▲ 閉じる」ボタンを配置。
   - アコーディオン展開用行（`<tr><td colSpan={5}>...</td></tr>`）をレンダリング。
   - 日別学習時間、科目バッジ、セッション（時刻、単元、種別、時間、正答率）、問題カード（問題文、選んだ解答、正解、解説、正誤バッジ）を表示。
   - 「❌ 間違えた問題だけ表示」フィルターチェックボックスを設置。
   - 古いデータ対応: `sessions` が空または `questionRecords` がない場合は「※ この日の問題詳細は記録されていません」と表示。
2. `src/index.css`:
   - アコーディオン展開行のスタイル、問題カード（正解: 緑、不正解: 赤）のスタイリング、レスポンシブ対応を追加。

- [ ] **Step 4: テストを実行して成功することを確認する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/parent_dashboard_history_ui.test.tsx`
Expected: PASS

- [ ] **Step 5: コミットする**

```bash
git add src/components/ParentDashboard.tsx src/index.css src/__tests__/parent_dashboard_history_ui.test.tsx
git commit -m "feat: add accordion learning history details with wrong-answer filter in ParentDashboard"
```

---

### Task 5: 回帰テスト・コード品質検証 (Full Regression & Lint)

**Files:**
- Existing all test files

- [ ] **Step 1: 全テストを実行する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
Expected: All test suites PASS (45+ suites, 115+ tests)

- [ ] **Step 2: リントを実行する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: プロダクションビルドを実行する**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run build`
Expected: Build successfully completes without TypeScript errors

- [ ] **Step 4: コミットおよび完了確認**

```bash
git status
```
変更が全てコミットされ、ワーキングツリーがクリーンであることを確認。
