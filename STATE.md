# Loop State — Kids Learning App (kids-learning-app)

Last run: 2026-07-27 16:24 JST

## System Overview & Architecture
- **Framework**: React 19 + Vite 8 + TypeScript + Express (Node server.js)
- **Testing**: Vitest + jsdom + supertest (19 test suites, 35 passed)
- **Features**:
  - 文部科学省「学習指導要領LOD」準拠 小1〜中3 全5教科・全学年・全単元データ (`src/data/curriculumLOD.ts`)
  - 重複ゼロ保証機能付き単元ピンポイント動的問題生成エンジン (`src/utils/questionGenerator.ts`)
  - 家族マルチプロファイル切り替え・暗証番号設定 (`ProfileSelectorModal.tsx`, `storage.ts`)
  - 起動時プロフィール選択画面表示（`App.tsx`）
  - 全体＆特定科目・特定単元・教科別個別ノルマ設定機能（`ParentDashboard.tsx`）
  - 学習進捗API (`/api/progress`) & ロードマップ表示 (`RoadmapScreen.tsx`)

## High Priority (Active Tasks & Loops)
- [x] 🐛 **選択肢重複ゼロ完全保証バグ修正** (`questionGenerator.ts`, `unique_options_fix.test.ts`)
- [x] 🎯 **ノルマの細分化機能の実装** (特定科目・特定単元指定、教科別個別問題数目標 `ParentDashboard.tsx`, `daily_goal_subjects.test.ts`)
- [x] 👤 **起動時プロフィール選択モーダルの自動表示** (`App.tsx`, `initial_profile_modal.test.ts`)
- [x] 🧪 **TDDによる全35テストケース100%パス ＆ ビルド成功** (`npm test`, `npm run build`)
- [x] `Loop Engineering` パターンの継続的品質ループ検証

## Watch List
- [ ] 今後の新問題追加および単元データの拡張時、`npm test` による回帰検証
- [ ] レスポンシブデザインの各種画面サイズでの見切れ防止チェック

## Post-Run Critique
- 選択肢重複バグの根本原因であったデータ不整合（『温故知新』の重複など）と数値生成時の偶発重複を解消し、`ensureUniqueOptions` 安全レイヤーにより完全な選択肢一意性を担保。
- ノルマ細分化（科目・単元・教科別）と起動時プロフィール選択により、お子様の自立的学習開始と詳細な学習計画の設定が実現。
- TDDサイクル（Red-Green-Refactor）に基づき、全19ファイル35テストの完全グリーンとビルド成功を確認。