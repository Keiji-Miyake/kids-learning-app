# Safety & Autonomy Policy — Kids Learning App

## Safety Levels
- **L1 (Report Only)**: 問題検知およびレポート作成のみ。自動変更は行わない。
- **L2 (Assisted / Gated Fixes)**: テスト自動実行（TDD）でパスが確認された場合のみローカル変更を反映。
- **L3 (Unattended Automation)**: 明示的なガードレールおよび自動ビルド通過後にマージ。

## Denylist / Restricted Paths
- `.env` や機密情報を含む設定ファイルの自動コミット禁止。
- ユーザー認証データやパスワード設定部分の無断上書き禁止。

## Verification & Execution Gates
1. `npm test` による全テストケースのパス（Red -> Green の確認）
2. `npm run build` による型チェックおよびプロダクションビルドの成功
