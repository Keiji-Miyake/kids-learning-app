---
name: ssh-app-deploy
description: 任意の Linux サーバー / Raspberry Pi / VPS へ Node.js アプリを SSH 経由でビルド・同期・常時稼働させる汎用 SSH デプロイスキル
---

# 🚀 汎用 SSH デプロイスキル (ssh-app-deploy)

本スキルは、Node.js + Express / Vite Web アプリケーションを任意の SSH 対応リモートサーバー（Raspberry Pi、Ubuntu Server、Debian VPS、各種クラウドホストなど）へ安全・高速に同期・常時稼働させるための汎用自動デプロイガイドです。

---

## 🛠️ 1. ローカルでの動作確認 ＆ ビルド

### 全自動ユニットテストの実行
```bash
npm test
```

### プロダクションビルドの生成
```bash
npm run build
```
*(※ `dist/` ディレクトリにフロントエンドアセットが出力され、`server.js` が静的配信します)*

---

## 📦 2. 汎用 SSH デプロイ手順

### 対象サーバー環境
- OS: 任意の Linux (Ubuntu, Debian, Raspberry Pi OS, CentOS 等)
- ランタイム: Node.js (v18.x 以上推奨)

### A. ビルド ＆ パッケージング
```bash
npm run build
tar czf app-release.tar.gz dist server.js package.json package-lock.json
```

### B. SSH 転送 ＆ リモートサーバーでのプロセス起動
環境変数 `REMOTE_USER` と `REMOTE_HOST` を指定して実行します。

```bash
# 成果物をリモートサーバーの /tmp へ転送
scp app-release.tar.gz <REMOTE_USER>@<REMOTE_HOST>:/tmp/

# リモートサーバー上での展開・依存関係インストール・プロセス再起動 (例: PORT=3002)
ssh <REMOTE_USER>@<REMOTE_HOST> "mkdir -p ~/app-deploy && tar xzf /tmp/app-release.tar.gz -C ~/app-deploy && cd ~/app-deploy && npm install --omit=dev && pkill -f 'node server.js' || true; PORT=3002 nohup node server.js > ~/app.log 2>&1 &"
```

---

## 🔄 3. pm2 または systemd による自動常時稼働 (推奨)

### pm2 を使用する場合
```bash
ssh <REMOTE_USER>@<REMOTE_HOST> "cd ~/app-deploy && pm2 restart app || PORT=3002 pm2 start server.js --name 'app' && pm2 save"
```

### crontab (@reboot) を使用する場合
```bash
ssh <REMOTE_USER>@<REMOTE_HOST> "(crontab -l 2>/dev/null | grep -v 'app-deploy'; echo '@reboot PORT=3002 nohup node /home/<REMOTE_USER>/app-deploy/server.js > ~/app.log 2>&1 &') | crontab -"
```

---

## 🔒 4. セキュリティ ＆ 個人情報保護ガイド

- リポジトリ公開時、`.gitignore` に `db.json`, `.env`, `*.log`, `node_modules`, `dist` が指定されていることを確認する。
- リモートホストの IP アドレス、秘密鍵パスワード等は環境変数または引数で渡すように抽象化し、Git コミット対象にしない。
