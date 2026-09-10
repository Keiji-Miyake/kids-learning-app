# 保護者管理画面 学習履歴詳細化（学習時間・科目・単元・問題内容）機能設計仕様書

- **作成日**: 2026-09-11
- **ステータス**: Pending Review
- **対象**: Kids LearnQuest (kids-learning-app)

---

## 1. 概要と目的

保護者管理画面（`ParentDashboard.tsx`）において、お子様の日々の学習活動の透明性を高め、親子の学習サポートを円滑にするため、日々の学習履歴を詳細に把握できる機能を導入する。
従来は「日付」「解いた問題数」「正解数」「正答率」のみの表示であったが、本機能により以下の情報を直感的に確認できるようにする：

1. **その日の総学習時間**（分・秒単位での可視化）
2. **取り組んだ科目および単元名**（例: 算数「大きな数」、理科「こん虫のからだ」など）
3. **解いた問題ごとの詳細**（問題文、お子様が選んだ解答、正解、解説、正誤判定）
4. **通常クイズ（5問）と単元確認テスト（10問）の両方の記録追跡**

UIレイアウトには、同一画面内でサクサク確認できる **【アコーディオン展開式】** を採用し、「間違えた問題だけを絞り込み表示」できるフィルターも備える。

---

## 2. 要件仕様

1. **問題ごとの履歴データ保持 (`SessionQuestionRecord`)**:
   - 出題された各問題について、問題ID、問題文、お子様が選択した解答（時間切れ時は「(時間切れ・無解答)」）、正解、正誤判定（true/false）、解説を保持する。
2. **セッション単位での単元・時間・問題詳細の記録 (`QuizSession`)**:
   - クイズまたは単元確認テスト1回ごとに1つのセッションを生成する。
   - 実施時刻（timestamp）、科目（subject）、単元名（unitName）、セッション種別（sessionType: 'quiz' | 'exam'）、所要時間（durationMinutes, durationSeconds）、問題ごとの詳細配列（questionRecords）を記録する。
3. **クイズ画面 (`QuizScreen.tsx`) の解答履歴トラッキング**:
   - 各問題への回答時にお子様が選択した選択肢を記録し、クイズ終了時に `SessionQuestionRecord[]` を構築して `onFinish` に渡す。
4. **単元確認テスト画面 (`ExamScreen.tsx`) の学習レポート保存連動**:
   - 単元確認テスト（10問）の提出時にも所要時間と各問題の正誤・解答レコードを生成し、`storage.addReportData` を呼び出して学習レポートに自動記録する。
5. **ストレージ層 (`storage.ts`) の保存拡張と永続化**:
   - `addReportData` で `sessionDetails`（単元名、セッション種別、問題記録）を受け取り、当日レポート（`DailyReport`）の `sessions` 配列に格納する。
   - ローカルストレージ（`localStorage`）およびサーバーDB（`db.json` / `/api/reports/:profileId`）へ安全に同期・永続化する。
6. **保護者画面 (`ParentDashboard.tsx`) のアコーディオンUI**:
   - 「📅 日々の記録」テーブルの日付行（または「詳細を見る」ボタン）をクリックすることで、該当日の学習詳細が直下にスライド展開される。
   - その日の総学習時間、科目別内訳バッジ、セッション一覧、問題カード（正解は緑枠・不正解は赤枠）を表示する。
   - 「❌ 間違えた問題だけ表示」切り替えスイッチを設置し、つまずきポイントの重点確認を可能にする。
7. **後方互換性と安全性**:
   - `questionRecords` や `unitName` が存在しない過去の履歴データがあっても、UIがクラッシュせず安全にフォールバック表示（「※ この日の問題詳細は記録されていません」）される。

---

## 3. データ構造と型定義 (`src/types/index.ts`)

### 3.1 解答問題レコード型 (`SessionQuestionRecord`)
```typescript
export interface SessionQuestionRecord {
  questionId: string;
  questionText: string;
  selectedAnswer: string;  // お子様が選んだ解答
  correctAnswer: string;   // 正解
  isCorrect: boolean;      // 正誤 (true: ◯, false: ✕)
  explanation: string;     // 解説
}
```

### 3.2 学習セッション型 (`QuizSession`) の拡張
```typescript
export interface QuizSession {
  id?: string;             // セッションID
  subject: Subject;        // 科目
  unitName?: string;       // 単元名 (未設定時は "全般（ランダム）")
  sessionType?: 'quiz' | 'exam'; // クイズ(5問) または 単元確認テスト(10問)
  questionsAttempted: number;
  questionsCorrect: number;
  durationMinutes: number; // 分単位
  durationSeconds?: number;// 秒単位
  timestamp: string;       // 実施日時 (ISO)
  questionRecords?: SessionQuestionRecord[]; // 解いた問題の詳細一覧
}
```

### 3.3 日別レポート型 (`DailyReport`)
既存構造との100%互換を維持：
```typescript
export interface DailyReport {
  date: string; // YYYY-MM-DD
  subjectMinutes: Record<Subject, number>;
  questionsAttempted: number;
  questionsCorrect: number;
  totalQuestions?: number;
  subjectBreakdown?: Partial<Record<Subject, { total: number; correct?: number }>>;
  sessions?: QuizSession[];
}
```

---

## 4. コンポーネントおよびロジック変更仕様

### 4.1 `src/components/QuizScreen.tsx`
- **ステート追加**:
  - `userAnswers: Record<number, string>` (問題インデックスごとの選択値)
- **解答時処理 (`handleAnswerSelect`)**:
  - 選択した option を `userAnswers` に記録。
- **タイムアウト時処理 (`handleTimeOut`)**:
  - `'(時間切れ・無解答)'` を `userAnswers` に記録。
- **終了時処理 (`onFinish`)**:
  - `questions` と `userAnswers` から `SessionQuestionRecord[]` を生成し、コールバック引数に含めて呼び出す。
  - シグネチャ: `onFinish(correctCount: number, totalCount: number, wrongQuestionIds: string[], questionRecords?: SessionQuestionRecord[]) => void`

### 4.2 `src/components/ExamScreen.tsx`
- **終了時処理 (`handleSubmitExam`)**:
  - 各問題の `userAnswers[idx]`（未選択時は `'(無解答)'`）をもとに `SessionQuestionRecord[]` を構築。
  - 所要秒数 `const timeSpentSeconds = Math.max(1, 600 - timeLeft)` を算出。
  - テスト結果オブジェクトに `questionRecords` と `timeSpentSeconds` を含め、`onFinish` コールバックに渡す。
  - （または `handleSubmitExam` 内で直接 `storage.addReportData(subject, correctCount, timeSpentSeconds, profile.id, questions.length, { unitName, sessionType: 'exam', questionRecords })` を呼び出して確実に永続化する。今回は確実性と既存の `markUnitCompleted` 呼び出し箇所との一貫性から、提出完了時に `ExamScreen` 内で直接 `storage.addReportData` を呼び出す）。

### 4.3 `src/utils/storage.ts`
- **`addReportData` の引数拡張**:
  ```typescript
  addReportData(
    subject: string,
    correct: boolean | number,
    timeSpentSeconds: number,
    profileId?: string,
    totalAttempted?: number,
    sessionDetails?: {
      unitName?: string;
      sessionType?: 'quiz' | 'exam';
      questionRecords?: SessionQuestionRecord[];
    }
  ): void
  ```
- セッションオブジェクト作成時：
  ```typescript
  const session: QuizSession = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    subject: subjectKey,
    unitName: sessionDetails?.unitName || '全般（ランダム）',
    sessionType: sessionDetails?.sessionType || 'quiz',
    questionsAttempted: attempted,
    questionsCorrect: correctNum,
    durationMinutes,
    durationSeconds: timeSpentSeconds,
    timestamp: new Date().toISOString(),
    questionRecords: sessionDetails?.questionRecords || []
  };
  todayReport.sessions.push(session);
  ```

### 4.4 `src/App.tsx`
- `handleFinishQuiz`:
  - `QuizScreen` から渡された `questionRecords` を受け取る。
  - `unitName = activeUnit ? activeUnit.unitName : '全般（ランダム）'` を決定。
  - `storage.addReportData(activeSubject, correctCount, timeSpentSeconds, activeProfile.id, totalCount, { unitName, sessionType: 'quiz', questionRecords })` を実行。

### 4.5 `src/components/ParentDashboard.tsx`
- **展開行ステート**:
  - `expandedDate: string | null` (現在アコーディオンが開いている日付、再クリックでトグル閉じ)
  - `onlyWrongFilter: boolean` (間違えた問題のみ表示トグル)
- **日々の記録テーブル拡張**:
  - 各日付行に「操作」列（「▼ 詳細を見る」/「▲ 閉じる」ボタン）を追加。
  - 行クリックでもトグル可能にする。
- **展開詳細パネル (`ExpandedHistoryDetails`)**:
  - **日別サマリーヘッダー**:
    - 総学習時間（分・秒）
    - 実施科目バッジ（科目名＋学習時間）
    - 総合正答率
  - **絞り込みコントロール**:
    - 「❌ 間違えた問題だけ表示」チェックボックス
  - **セッションリスト**:
    - 実施時刻（HH:mm）
    - 種別バッジ（クイズ 5問 / 単元確認テスト 10問）
    - 科目アイコン ＋ 科目名 ＋ 単元名
    - セッション所要時間（例: 2分35秒）
    - 正答数（例: 4 / 5 問正解）
  - **問題カードリスト**:
    - `isCorrect` に応じた枠線・バッジ（緑: ◯ 正解 / 赤: ✕ 不正解）
    - 問題文テキスト
    - 回答表示：
      - 正解時: `お子様の回答: ○○○`
      - 不正解時: `お子様の回答: ○○○ ➔ 正解: △△△`
    - 解説テキスト（`💡 解説: ...`）
  - **フォールバック**:
    - `sessions` が空または `questionRecords` がない場合は「この日の詳細問題ログはありません」メッセージを提示。

---

## 5. UIスタイル設計 (`src/index.css` または `App.css`)

- アコーディオン展開行: `expanded-history-row`（背景色: `#f8fafc`、上部境界線付き）
- 詳細コンテナ: `history-detail-container`（パディング、角丸、なめらかなアコーディオン表示）
- セッションカード: `session-card`（白背景、境界線 `#e2e8f0`、影付き）
- 問題カード:
  - 正解: `question-record-card correct`（ボーダー `#86efac`、薄緑背景 `#f0fdf4`）
  - 不正解: `question-record-card wrong`（ボーダー `#fca5a5`、薄赤背景 `#fef2f2`）
- レスポンシブ対応:
  - モバイル画面（幅600px以下）でもテーブルの横スクロールおよび問題カードの縦積み表示で快適に閲覧可能。

---

## 6. テスト計画

### 6.1 ユニットテスト (`src/__tests__/learning_history_details.test.ts`)
1. **データ保存・取得テスト**:
   - `storage.addReportData` に `sessionDetails`（単元名、問題詳細、セッション種別）を渡した際、`storage.getReports` で正しく取得できること。
   - `QuizScreen` の `onFinish` で `SessionQuestionRecord[]` が正解・不正解・時間切れを含めて正しく生成されること。
2. **単元確認テスト連携テスト**:
   - `ExamScreen` 終了時に `sessionType: 'exam'` および `unitName` とともにレポートが登録されること。
3. **下位互換性テスト**:
   - 古いフォーマット（`sessions` が空、または `questionRecords` がない）のレポートでも例外をスローせず正常に扱えること。

### 6.2 UIコンポーネントテスト (`src/__tests__/parent_dashboard_history.test.tsx`)
1. 日付行をクリックした際、アコーディオンが展開され、総学習時間やセッション情報・問題カードが表示されること。
2. 「間違えた問題だけ表示」をオンにした際、正解した問題が非表示となり不正解問題のみが残ること。
3. 再度クリックした際にアコーディオンが閉じること。

### 6.3 回帰テスト
- `wsl --cd /home/dev/workspace/kids-learning-app npm test` で全テスト（既存42ファイル含む）がパスすること。
- `wsl --cd /home/dev/workspace/kids-learning-app npm run lint` でリントエラーがないこと。
