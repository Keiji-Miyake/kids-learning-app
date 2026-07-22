# 🌐 汎用 SSH デプロイ ＆ 常時稼働ガイド

本アプリ（Kids LearnQuest）は、Node.js + Express による超軽量設計（メモリ使用量約 30MB〜50MB）のため、**任意の Linux サーバー、Raspberry Pi、VPS、クラウドホスト環境で常時稼働・デプロイが可能**です。

---

## 🚀 1. サーバー環境の準備

### 推奨環境
- **OS**: 任意の Linux (Debian, Ubuntu, Raspberry Pi OS, AlmaLinux 等)
- **Node.js**: v18.0 以上推奨

### サーバーでの Node.js 確認
```bash
node -v
```

---

## 📦 2. アプリの配置とビルド

### ① ローカルでのパッケージング
```bash
# ビルド
npm run build

# 成果物のアーカイブ化
tar czf app-release.tar.gz dist server.js package.json package-lock.json
```

### ② SSH 経由での転送
```bash
scp app-release.tar.gz <REMOTE_USER>@<REMOTE_HOST>:/tmp/
```

### ③ サーバー上での展開と起動
```bash
ssh <REMOTE_USER>@<REMOTE_HOST> "mkdir -p ~/kids-learning-app && tar xzf /tmp/app-release.tar.gz -C ~/kids-learning-app && cd ~/kids-learning-app && npm install --omit=dev && PORT=3002 nohup node server.js > ~/app.log 2>&1 &"
```

---

## 🔄 3. pm2 による自動再起動・常時稼働 (推奨)

```bash
# pm2 のインストール
sudo npm install -g pm2

# ポート3002指定でプロセス起動
PORT=3002 pm2 start server.js --name "kids-app"

# 再起動時の自動起動登録
pm2 startup
pm2 save
```

---

## 📱 4. ネットワークアクセス

サーバーの IP アドレス（例: `192.168.x.x` または ドメイン）を確認し、ブラウザから以下を開いてアクセスします：

```text
http://<SERVER_IP_OR_DOMAIN>:3002
```
*(※ ポート番号は環境変数 PORT で変更可能です)*
