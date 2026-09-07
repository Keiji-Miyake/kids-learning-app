# 2学期制（二期制：前期・後期）カリキュラム対応 実装計画書

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** お子様向け学習アプリにおいて、学校の学期形態（3学期制 / 2学期制）に合わせてカリキュラム単元表示を「前期」「後期」へ切り替えられるようにし、ロードマップ画面上での比較切り替え機能を提供する。

**Architecture:** `src/types/index.ts` に `SemesterSystem` 型と `UserProfile.semesterSystem` を追加。`src/data/curriculumLOD.ts` の全単元に文部科学省指導要領に準拠した `semesterTerm: '前期' | '後期'` を配当し、表示用ヘルパー `getDisplayTerm` を提供。`ProfileSelectorModal.tsx` で学期制を設定可能にし、`RoadmapScreen.tsx` で比較切り替えスイッチ、`SubjectCard.tsx` で単元ラベルの自動連動を実装する。

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Tailwind CSS

## Global Constraints

- 日本語の自然な教育用語（前期・後期、3学期制・2学期制）を使用すること。
- 既存のDB（`db.json`）、進捗データ、テストとの100%後方互換性を保持すること（未設定時は `'3-term'` としてフォールバック）。
- テストコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
- リントコマンド: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`

---

### Task 1: 型定義の拡張とカリキュラムLODデータの二期制配当・ヘルパー関数

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/curriculumLOD.ts`
- Test: `src/__tests__/semester_system.test.ts`

**Interfaces:**
- Produces:
  - `export type SemesterSystem = '3-term' | '2-term';`
  - `CurriculumUnit.semesterTerm?: '前期' | '後期';`
  - `getDisplayTerm(unit: CurriculumUnit, system?: SemesterSystem): string;`

- [ ] **Step 1: 失敗する単体テストを作成**

```typescript
// src/__tests__/semester_system.test.ts
import { describe, it, expect } from 'vitest';
import { curriculumLOD, getDisplayTerm, getCurriculumUnits } from '../data/curriculumLOD';
import type { SemesterSystem } from '../types';

describe('カリキュラムLOD 2学期制（前期・後期）対応テスト', () => {
  it('getDisplayTerm: 3学期制のときは unit.term を返却する', () => {
    const unit = curriculumLOD[0]; // cos-m1-01 (1学期)
    expect(getDisplayTerm(unit, '3-term')).toBe('1学期');
  });

  it('getDisplayTerm: 2学期制のときは unit.semesterTerm を返却する', () => {
    const unit1 = curriculumLOD[0]; // cos-m1-01 (1学期 / 前期)
    expect(getDisplayTerm(unit1, '2-term')).toBe('前期');

    // くりさがりの ある ひきざん (cos-m1-05: 3学期 / 後期)
    const unit5 = curriculumLOD.find(u => u.code === 'cos-m1-05')!;
    expect(getDisplayTerm(unit5, '2-term')).toBe('後期');
  });

  it('全単元（小1〜中3、全教科）に semesterTerm (前期 | 後期) が正しく設定されている', () => {
    for (const unit of curriculumLOD) {
      expect(['前期', '後期']).toContain(unit.semesterTerm);
    }
  });

  it('フォールバック単元でも getDisplayTerm が正しく動作する', () => {
    const fallbackUnits = getCurriculumUnits('math', 99);
    expect(fallbackUnits.length).toBeGreaterThan(0);
    const fb = fallbackUnits[0];
    expect(getDisplayTerm(fb, '3-term')).toBe('通年');
    expect(getDisplayTerm(fb, '2-term')).toBe('前期');
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/semester_system.test.ts`
Expected: FAIL (SemesterSystem や getDisplayTerm 未定義、または semesterTerm が未設定)

- [ ] **Step 3: 型定義と LOD データの二期制配当・ヘルパー関数を実装**

1. `src/types/index.ts` に追加:
```typescript
export type SemesterSystem = '3-term' | '2-term';
```
`UserProfile` に `semesterSystem?: SemesterSystem;` を追加。

2. `src/data/curriculumLOD.ts` の `CurriculumUnit` に `semesterTerm?: '前期' | '後期';` を追加。
3. `curriculumLOD` の全単元に文部科学省指導計画に準拠した `semesterTerm` を付与。
4. `getDisplayTerm` 関数をエクスポート:
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

- [ ] **Step 4: テストを実行して成功することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/semester_system.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/types/index.ts src/data/curriculumLOD.ts src/__tests__/semester_system.test.ts
git commit -m "feat: add SemesterSystem type, semesterTerm in curriculumLOD, and getDisplayTerm helper"
```

---

### Task 2: プロフィールストレージでの `semesterSystem` 永続化と後方互換性

**Files:**
- Modify: `src/utils/storage.ts`
- Test: `src/__tests__/profile_semester_persistence.test.ts`

**Interfaces:**
- Consumes: `SemesterSystem` from `src/types`
- Produces: `storage.addProfile`, `storage.updateProfile`, `storage.getProfiles` with `semesterSystem` preservation

- [ ] **Step 1: 失敗する単体テストを作成**

```typescript
// src/__tests__/profile_semester_persistence.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { UserProfile } from '../types';

describe('UserProfile semesterSystem 永続化テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('新規プロフィール作成時に semesterSystem を保存・取得できる', () => {
    const profile = storage.addProfile('次郎', '👦', 4, undefined, undefined, '2-term');
    expect(profile.semesterSystem).toBe('2-term');

    const loaded = storage.getProfile(profile.id);
    expect(loaded?.semesterSystem).toBe('2-term');
  });

  it('既存プロフィールの semesterSystem を updateProfile で更新できる', () => {
    const profile = storage.addProfile('花子', '👧', 2);
    expect(profile.semesterSystem).toBeUndefined(); // または '3-term'

    const updated: UserProfile = {
      ...profile,
      semesterSystem: '2-term'
    };
    storage.updateProfile(updated);

    const reloaded = storage.getProfile(profile.id);
    expect(reloaded?.semesterSystem).toBe('2-term');
  });

  it('semesterSystem が未設定の古いプロフィールでも安全に読み込まれる（後方互換）', () => {
    const legacyProfile: UserProfile = {
      id: 'legacy-1',
      name: '太郎',
      avatarEmoji: '👦',
      grade: 3,
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
        lastActiveDate: null, unlockedBadges: [],
        equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    };
    storage.saveProfiles([legacyProfile]);
    const profiles = storage.getProfiles();
    expect(profiles[0].id).toBe('legacy-1');
    expect(profiles[0].semesterSystem).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/profile_semester_persistence.test.ts`
Expected: FAIL (addProfile 引数不一致または未保存)

- [ ] **Step 3: `storage.ts` の実装**

`addProfile` メソッドの引数に `semesterSystem?: SemesterSystem` をサポート（またはオブジェクト引数対応）し、作成・更新時に確実に永続化する。

- [ ] **Step 4: テストを実行して成功することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/profile_semester_persistence.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/storage.ts src/__tests__/profile_semester_persistence.test.ts
git commit -m "feat: persist semesterSystem in UserProfile storage"
```

---

### Task 3: `ProfileSelectorModal.tsx` での学期制設定UI

**Files:**
- Modify: `src/components/ProfileSelectorModal.tsx`
- Test: `src/__tests__/profile_selector_semester_ui.test.tsx`

**Interfaces:**
- Consumes: `SemesterSystem` from `src/types`
- Produces: 学期制選択セレクトボックス（新規作成フォームおよび編集フォーム）

- [ ] **Step 1: 失敗するコンポーネントテストを作成**

```tsx
// src/__tests__/profile_selector_semester_ui.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';
import { storage } from '../utils/storage';
import type { UserProfile } from '../types';

describe('ProfileSelectorModal 学期制設定UIテスト', () => {
  beforeEach(() => {
    localStorage.clear();
    const testProfile: UserProfile = {
      id: 'test-child-1',
      name: 'テスト生徒',
      avatarEmoji: '👦',
      grade: 3,
      semesterSystem: '3-term',
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
        lastActiveDate: null, unlockedBadges: [],
        equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    };
    storage.saveProfiles([testProfile]);
    storage.setActiveProfileId('test-child-1');
  });

  it('プロフィール編集モードで学期制の選択肢（3学期制 / 2学期制）が表示され、変更して保存できる', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ProfileSelectorModal onSelectProfile={onSelect} onClose={onClose} />);

    // 編集ボタンをクリック
    const editBtn = screen.getByText('へんしゅう ✏️');
    fireEvent.click(editBtn);

    // 学期制のラベルとセレクトが存在することを確認
    const semesterSelect = screen.getByLabelText('学期制：') as HTMLSelectElement;
    expect(semesterSelect).toBeDefined();
    expect(semesterSelect.value).toBe('3-term');

    // 2学期制に変更
    fireEvent.change(semesterSelect, { target: { value: '2-term' } });
    expect(semesterSelect.value).toBe('2-term');

    // 保存ボタンをクリック
    const saveBtn = screen.getByText('ほぞんする ✨');
    fireEvent.click(saveBtn);

    // ストレージに semesterSystem: '2-term' が保存されていることを検証
    const saved = storage.getProfile('test-child-1');
    expect(saved?.semesterSystem).toBe('2-term');
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/profile_selector_semester_ui.test.tsx`
Expected: FAIL (getByLabelText('学期制：') が見つからない)

- [ ] **Step 3: `ProfileSelectorModal.tsx` に学期制設定UIを実装**

1. `editSemesterSystem` state を追加:
```typescript
const [editSemesterSystem, setEditSemesterSystem] = useState<SemesterSystem>('3-term');
```
2. 編集オープン時（`handleStartEdit`）に `target.semesterSystem || '3-term'` で初期化。新規作成時も同様に初期化。
3. フォームに学期制セレクトを追加:
```tsx
<div className="profile-form-group">
  <label htmlFor="edit-semester-system">学期制：</label>
  <select
    id="edit-semester-system"
    className="profile-grade-select"
    value={editSemesterSystem}
    onChange={(e) => setEditSemesterSystem(e.target.value as SemesterSystem)}
  >
    <option value="3-term">3学期制（1学期・2学期・3学期）</option>
    <option value="2-term">2学期制（前期・後期）</option>
  </select>
</div>
```
4. 保存時に `semesterSystem: editSemesterSystem` を反映。

- [ ] **Step 4: テストを実行して成功することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/profile_selector_semester_ui.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/ProfileSelectorModal.tsx src/__tests__/profile_selector_semester_ui.test.tsx
git commit -m "feat: add semester system selector in ProfileSelectorModal"
```

---

### Task 4: `RoadmapScreen.tsx` での二期制バッジ表示と学期比較切り替えスイッチ

**Files:**
- Modify: `src/components/RoadmapScreen.tsx`
- Test: `src/__tests__/roadmap_screen_semester.test.tsx`

**Interfaces:**
- Consumes: `profile.semesterSystem` and `getDisplayTerm` from `src/data/curriculumLOD`
- Produces: 3学期制 ⇔ 2学期制 比較切り替えUIと動的学期バッジ（`node-term`）

- [ ] **Step 1: 失敗するコンポーネントテストを作成**

```tsx
// src/__tests__/roadmap_screen_semester.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoadmapScreen } from '../components/RoadmapScreen';
import type { UserProfile } from '../types';

describe('RoadmapScreen 2学期制対応と表示比較切り替えテスト', () => {
  const profile2Term: UserProfile = {
    id: 'user-2term',
    name: '2期生',
    avatarEmoji: '👦',
    grade: 1,
    semesterSystem: '2-term',
    stats: {
      level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
      lastActiveDate: null, unlockedBadges: [],
      equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
      ownedItems: []
    }
  };

  it('2学期制のプロフィールでは初期状態で「前期」「後期」バッジが表示される', () => {
    render(
      <RoadmapScreen
        profile={profile2Term}
        onSelectUnitQuiz={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // 小1算数の1単元目（かずと たしざん）は前期
    expect(screen.getAllByText('前期').length).toBeGreaterThan(0);
    // 5単元目（くりさがりの ある ひきざん）は後期
    expect(screen.getAllByText('後期').length).toBeGreaterThan(0);
  });

  it('「3学期制」トグルボタンを押すと表示が「1学期」「2学期」「3学期」に切り替わる', () => {
    render(
      <RoadmapScreen
        profile={profile2Term}
        onSelectUnitQuiz={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // 3学期制ボタンを押下
    const triTermBtn = screen.getByRole('button', { name: /3学期制/i });
    fireEvent.click(triTermBtn);

    // バッジが「1学期」「2学期」「3学期」に切り替わる
    expect(screen.getAllByText('1学期').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3学期').length).toBeGreaterThan(0);

    // 再度「2学期制」ボタンを押下
    const biTermBtn = screen.getByRole('button', { name: /2学期制/i });
    fireEvent.click(biTermBtn);

    expect(screen.getAllByText('前期').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/roadmap_screen_semester.test.tsx`
Expected: FAIL (トグルボタンが存在しない、または前期/後期バッジが表示されない)

- [ ] **Step 3: `RoadmapScreen.tsx` に比較切り替えスイッチと `getDisplayTerm` を実装**

1. `viewSemesterSystem` state を追加:
```typescript
const [viewSemesterSystem, setViewSemesterSystem] = useState<SemesterSystem>(
  profile.semesterSystem || '3-term'
);
```
2. コントロール欄（学年選択の横など）にトグルボタングループを追加:
```tsx
<div className="roadmap-semester-toggle">
  <label>学期表示：</label>
  <div className="semester-toggle-group">
    <button
      type="button"
      className={`semester-toggle-btn ${viewSemesterSystem === '3-term' ? 'active' : ''}`}
      onClick={() => { sound.playClick(); setViewSemesterSystem('3-term'); }}
    >
      3学期制
    </button>
    <button
      type="button"
      className={`semester-toggle-btn ${viewSemesterSystem === '2-term' ? 'active' : ''}`}
      onClick={() => { sound.playClick(); setViewSemesterSystem('2-term'); }}
    >
      2学期制
    </button>
  </div>
</div>
```
3. 単元バッジの描画に `getDisplayTerm` を使用:
```tsx
<span className="node-term">{getDisplayTerm(unit, viewSemesterSystem)}</span>
```
4. 必要に応じてCSSスタイルを追加（`src/index.css` に `.roadmap-semester-toggle`, `.semester-toggle-group`, `.semester-toggle-btn.active` などを調整）。

- [ ] **Step 4: テストを実行して成功することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/roadmap_screen_semester.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/RoadmapScreen.tsx src/index.css src/__tests__/roadmap_screen_semester.test.tsx
git commit -m "feat: add semester system toggle and display support in RoadmapScreen"
```

---

### Task 5: `SubjectCard.tsx` と `App.tsx` の連動

**Files:**
- Modify: `src/components/SubjectCard.tsx`
- Modify: `src/App.tsx`
- Test: `src/__tests__/subject_card_semester.test.tsx`

**Interfaces:**
- Consumes: `semesterSystem` prop in `SubjectCard` from `profile.semesterSystem`
- Produces: 単元セレクトドロップダウンと年間単元一覧での適切な学期名表示

- [ ] **Step 1: 失敗するコンポーネントテストを作成**

```tsx
// src/__tests__/subject_card_semester.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubjectCard } from '../components/SubjectCard';

describe('SubjectCard 2学期制ラベル表示テスト', () => {
  it('semesterSystem が 2-term の場合、単元オプションに [前期] / [後期] が表示される', () => {
    render(
      <SubjectCard
        id="math"
        title="算数"
        emoji="🧮"
        colorClass="math-color"
        description="算数のテスト"
        defaultGrade={1}
        semesterSystem="2-term"
        onSelect={vi.fn()}
      />
    );

    // ドロップダウンのオプション内に [前期] が含まれることを確認
    const select = screen.getByRole('combobox', { name: /挑戦する単元/i });
    expect(select.innerHTML).toContain('[前期]');
    expect(select.innerHTML).toContain('[後期]');
    expect(select.innerHTML).not.toContain('[1学期]');
  });
});
```

- [ ] **Step 2: テストを実行して失敗することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/subject_card_semester.test.tsx`
Expected: FAIL (SubjectCardProps に semesterSystem がなく、[1学期] が含まれている)

- [ ] **Step 3: `SubjectCard.tsx` と `App.tsx` を実装**

1. `SubjectCardProps` に `semesterSystem?: SemesterSystem` を追加。
2. ドロップダウン options のレンダリングで `getDisplayTerm(u, semesterSystem)` を使用:
```tsx
<option key={u.code} value={idx}>
  {`[${getDisplayTerm(u, semesterSystem)}] `}{u.unitName}
</option>
```
3. 年間単元一覧リストでも同様に `getDisplayTerm(u, semesterSystem)` を使用。
4. `App.tsx` で `SubjectCard` をレンダリングしている箇所に `semesterSystem={activeProfile?.semesterSystem}` を渡す。

- [ ] **Step 4: テストを実行して成功することを確認**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npx vitest run src/__tests__/subject_card_semester.test.tsx`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/SubjectCard.tsx src/App.tsx src/__tests__/subject_card_semester.test.tsx
git commit -m "feat: propagate semesterSystem to SubjectCard and App"
```

---

### Task 6: 全体回帰テスト・ビルド・リント検証

**Files:**
- None (検証のみ)

- [ ] **Step 1: 全テストスイートの実行**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm test`
Expected: ALL PASS

- [ ] **Step 2: リントの実行**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run lint`
Expected: 0 errors

- [ ] **Step 3: ビルドの実行**

Run: `wsl --cd /home/dev/workspace/kids-learning-app npm run build`
Expected: Build successfully created without type errors
