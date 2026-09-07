# 2学期制（二期制：前期・後期）カリキュラム対応 機能設計仕様書

- **作成日**: 2026-09-07
- **ステータス**: Approved
- **対象**: Kids LearnQuest (kids-learning-app)

---

## 1. 概要と目的

日本の小・中学校において普及している「2学期制（二期制：前期・後期）」を採用している学校に通うお子様向けに、学習アプリ内のカリキュラム単元表示を「前期」「後期」に切り替えられる機能を導入する。
お子様ごとの学校形態（3学期制または2学期制）に合わせてプロフィールで設定可能とし、ホーム画面の教科カードや学習ロードマップ画面において文部科学省の学習指導要領配当に準拠した学期区分を表示する。
さらに、学習ロードマップ上では「3学期制 ⇔ 2学期制」の表示比較切り替えをワンタップで行えるようにし、親子で進度を柔軟に把握できるようにする。

---

## 2. 要件仕様

1. **プロフィールごとの学期制設定**:
   - `UserProfile` に `semesterSystem?: '3-term' | '2-term'` を追加。
   - デフォルトは既存互換の `'3-term'`（3学期制）。
   - プロフィール新規作成・編集モーダル（`ProfileSelectorModal`）に選択ドロップダウンを配置。
2. **文部科学省指導要領に準拠した二期制配当**:
   - `CurriculumUnit` に `semesterTerm?: '前期' | '後期'` を追加。
   - 小1〜中3、全5教科の年間全単元について、文部科学省の年間指導計画（4月〜10月：前期、10月〜3月：後期）に準拠した二期制配当を定義。
3. **学期表示ヘルパー**:
   - `getDisplayTerm(unit: CurriculumUnit, system?: SemesterSystem): string` を提供。
   - `system === '2-term'` のときは `semesterTerm`（フォールバックあり）を返却。
   - `system === '3-term'` のときは `term`（または '通年'）を返却。
4. **学習ロードマップ画面（`RoadmapScreen.tsx`）での表示と比較切り替え**:
   - ロードマップ画面の初期表示はプロフィールの学期制に追従。
   - 学年選択UIの隣に「表示切り替え: [ 3学期制 | 2学期制 ]」スイッチを設置。
   - 切り替えにより、単元バッジ（`node-term`）が即時に「1学期/2学期/3学期」と「前期/後期」で切り替わり、相互の対応関係を比較可能。
5. **教科カード・単元選択（`SubjectCard.tsx`）での表示連動**:
   - ホーム画面の単元選択ドロップダウンおよび「年間単元一覧」アコーディオンで、プロフィールの学期制に応じた学期ラベルを表示。
6. **後方互換性と安全性**:
   - `semesterSystem` 未設定の既存プロファイルは `'3-term'` として動作。
   - 既存のDB（`db.json`）、進捗データ、テストを一切破壊しない。

---

## 3. データ構造

### 3.1 型定義 (`src/types/index.ts`)

```typescript
export type SemesterSystem = '3-term' | '2-term';

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  grade?: number;
  pin?: string;
  dailyGoal?: DailyGoal;
  weeklySchedule?: WeeklySchedule;
  stats: UserStats;
  semesterSystem?: SemesterSystem; // '3-term' (3学期制: デフォルト) | '2-term' (2学期制: 前期/後期)
}
```

### 3.2 カリキュラム単元データ (`src/data/curriculumLOD.ts`)

```typescript
export interface CurriculumUnit {
  code: string;
  unitName: string;
  description: string;
  grade: number;
  subject: string;
  term?: string;         // '1学期' | '2学期' | '3学期'
  semesterTerm?: string; // '前期' | '後期'
}
```

#### 各学年・教科の配当基準（文部科学省指導計画準拠）:
- 小1算数:
  - cos-m1-01 (1. かずと たしざん(1)): 1学期 / 前期
  - cos-m1-02 (2. ひきざん(1)): 1学期 / 前期
  - cos-m1-03 (3. 10より おおきい かず): 2学期 / 前期 (9〜10月実施)
  - cos-m1-04 (4. くりあがりの ある たしざん): 2学期 / 後期 (11月実施)
  - cos-m1-05 (5. くりさがりの ある ひきざん): 3学期 / 後期 (1〜2月実施)
- 小3算数:
  - cos-m3-01: 1学期 / 前期
  - cos-m3-02: 2学期 / 前期
  - cos-m3-03: 3学期 / 後期
- 中学各学年・各教科（数学、国語、理科、社会、英語）:
  - 1学期単元 ➔ 前期
  - 2学期前半単元 ➔ 前期
  - 2学期後半単元 ➔ 後期
  - 3学期単元 ➔ 後期

---

## 4. ヘルパー関数仕様 (`src/data/curriculumLOD.ts`)

```typescript
export const getDisplayTerm = (
  unit: CurriculumUnit,
  system: SemesterSystem = '3-term'
): string => {
  if (system === '2-term') {
    if (unit.semesterTerm) return unit.semesterTerm;
    return unit.term === '3学期' ? '後期' : '前期';
  }
  return unit.term || '通年';
};
```

---

## 5. UIコンポーネント詳細

### 5.1 プロフィール作成・編集 (`src/components/ProfileSelectorModal.tsx`)
- 新規追加（`mode === 'add'`）および編集（`mode === 'edit'`）に学期制セレクトボックスを追加。
- プロフィール保存時に `semesterSystem` を反映。

### 5.2 学習ロードマップ (`src/components/RoadmapScreen.tsx`)
- 表示制御State: `viewSemesterSystem`
- トグルUIで「3学期制」「2学期制」を切り替え可能。
- 単元バッジ表示: `<span className="node-term">{getDisplayTerm(unit, viewSemesterSystem)}</span>`

### 5.3 教科カード (`src/components/SubjectCard.tsx`)
- 単元セレクト `<option>` および年間単元一覧で `getDisplayTerm(u, semesterSystem)` を使用して表示。

---

## 6. テスト・検証計画

1. **単体テスト**:
   - `getDisplayTerm` のテスト（3学期制・2学期制それぞれの返却値、フォールバック挙動）。
   - 全単元に `term` および `semesterTerm` が適切に設定されていることのテスト。
   - `UserProfile` の `semesterSystem` 永続化（保存・再読み込み）のテスト。
2. **コンポーネントテスト**:
   - `RoadmapScreen`: 2学期制設定時に「前期」「後期」が表示されること、トグル押下で「3学期制」表示に切り替わること。
   - `ProfileSelectorModal`: 学期制の選択・変更が正しく `storage.updateProfile` に渡ること。
   - `SubjectCard`: プロフィールの学期制に応じたラベルが表示されること。
3. **ビルド & リント検証**:
   - `wsl --cd /home/dev/workspace/kids-learning-app npm test`
   - `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
