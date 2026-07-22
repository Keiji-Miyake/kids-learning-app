# 🚀 Kids LearnQuest (キッズ・ラーンクエスト)

小学校1年生〜中学校3年生まで対応！文部科学省「学習指導要領LOD」準拠の**5教科（算数/数学・国語・理科・社会・英語）全単元を完全網羅**した、楽しく学べる子ども向けゲーミフィケーション学習Webアプリケーションです。

---

## ✨ 主な特徴

- 🎒 **小1〜中3 全学年・全教科対応**: 文部科学省学習指導要領LODに基づき、各学年の単元を段階的に学習・復習可能。
- ♾️ **無限応用問題エンジン**: 毎回数値や問題文が動的に変化するため、丸暗記を防ぎ本当の計算力・思考力が身につきます。
- 🗺️ **インタラクティブ学習ロードマップ**: 教科・学年ごとの単元進行度が視覚的に一目でわかり、達成感を実感。
- 📝 **単元確認テスト ＆ 成績表機能**: 10問10分の制限時間テストで実力を判定（S/A/B/Cランク評価）。
- 🎮 **ゲーミフィケーション・コレクション要素**: クイズに答えてコインを獲得し、アバターやアクセサリー、称号を集められます。
- 🔒 **保護者専用マスターパスワード管理**: 保護者レポートの閲覧、1日の目標ノルマ・ご褒美の設定は親だけが知るパスワードで安全保護。
- 🛡️ **セッション ＆ プロフィール保護**: アカウント選択後の誤操作防止、他人のプロフィール編集・削除ガード完備。
- 🍓 **Raspberry Pi 4（ラズパイ4）常時稼働対応**: メモリ使用量わずか30MB〜50MBの超軽量 Node.js/Express 統合配信仕様。

---

## 🛠️ クイックスタート

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 初期データベースの準備
```bash
cp db.json.example db.json
```

### 3. 開発サーバーの起動 (Vite + Express)
```bash
npm run dev
```
ブラウザで `http://localhost:5173` にアクセスしてください。

---

## 🧪 テスト ＆ ビルド

```bash
# 全自動テストの実行 (Vitest)
npm test

# プロダクションビルド
npm run build
```

---

## 🌐 SSH 汎用デプロイ (Linux サーバー / Raspberry Pi / VPS)

詳細な手順については [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) および AGY スキル [ssh-app-deploy](file:///u:/home/dev/workspace/kids-learning-app/.agents/skills/ssh-app-deploy/SKILL.md) をご覧ください。



```bash
# 1. ビルドと転送
npm run build
tar czf app-release.tar.gz dist server.js package.json package-lock.json
scp app-release.tar.gz <REMOTE_USER>@<REMOTE_HOST>:/tmp/

# 2. サーバー上での起動 (PORT=3002)
ssh <REMOTE_USER>@<REMOTE_HOST> "mkdir -p ~/kids-learning-app && tar xzf /tmp/app-release.tar.gz -C ~/kids-learning-app && PORT=3002 nohup node ~/kids-learning-app/server.js > ~/app.log 2>&1 &"
```


---

## 📄 ライセンス
MIT License
