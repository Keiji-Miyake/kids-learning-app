# Loop Configuration — Kids Learning App

## Active Loops

| Pattern | Cadence | Status | Command |
|---------|---------|--------|---------|
| UI/Responsive Verification | Weekly (Mon) | L2 Active | `npm run lint` or script |
| Content Expansion & Test | Weekly (Thu) | L2 Active | `npm test && npm run build` |
| Progress & Data Audit | On Edit | Active | `npx @cobusgreyling/loop-audit .` |

## Human Gates & Safety Policies

- **テスト駆動（TDD）規則**: 新機能・バグ修正時は先に Red テストを作成すること。
- **自律的検証**: すべての変更後に `npm test && npm run build` を実行し、全テストパスを確認すること。
- **人間の承認が必要な変更**: データベーススキーマ変更、メジャー依存関係アップデート。

## Budget & Constraints

- Max sub-agent spawns per run: 2 (L2)
- State persistence: `STATE.md`, `loop-run-log.md`
- Token / Cost safety: `loop-budget.md`, `loop-constraints.md`

## Verifier & Quality Gates

- `vitest run` による静的・動的テスト（全単元・進捗データ・APIエンドポイント）
- `tsc -b && vite build` によるTypeScript型安全性の確認