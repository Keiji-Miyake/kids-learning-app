# Loop State — Kids Learning App (kids-learning-app)

Last run: 2026-07-22 16:30 JST

## System Overview & Architecture
- **Framework**: React 19 + Vite 8 + TypeScript + Express (Node server.js)
- **Testing**: Vitest + jsdom + supertest (5 test suites, 9 passed)
- **Features**:
  - 文部科学省「学習指導要領LOD」準拠 小1〜中3 全5教科・全学年・全単元データ (`src/data/curriculumLOD.ts`)
  - 単元ピンポイント動的問題生成エンジン (`src/utils/questionGenerator.ts`)
  - 家族マルチプロファイル切り替え・暗証番号設定 (`ProfileSelectorModal.tsx`, `storage.ts`)
  - 学習進捗API (`/api/progress`) & ロードマップ表示 (`RoadmapScreen.tsx`)
  - 教科カードの表示列数自由切り替え（自動/2列ワイド/3列標準）

## High Priority (Active Tasks & Loops)
- [x] 🌐 汎用「SSHデプロイスキル (`ssh-app-deploy`)」へのリファクタリング（特定機器名の抽象化、`DEPLOY_GUIDE.md` への移行）
- [x] ➕ 新規プロフィール追加機能の保護者限定化（`ProfileSelectorModal.tsx`）
- [x] ✏️ 他人のプロフィール編集防止機能の実装（`ProfileSelectorModal.tsx`）
- [x] 🔑 「保護者専用マスターパスワード管理画面」の導入（初期パスワード: `parent` / 変更可能）
- [x] 📱 アバターアイコンタップ型ドロップダウンメニュー ＆ 🚪 ログアウト機能の導入
- [x] TDDによる全25テストケースパス (`npm test`)
- [x] `Loop Engineering` (Cobus Greyling / Addy Osmani パターン) のプロジェクト導入













## Watch List
- [ ] 今後の新問題追加および単元データの拡張時、`npm test` による回帰検証
- [ ] レスポンシブデザインの各種画面サイズでの見切れ防止チェック

## Post-Run Critique
- TDDサイクル（Red-Green-Refactor）と Loop Engineering（STATE.md, LOOP.md, loop-audit）の連携により、100/100 L2 Ready を達成。