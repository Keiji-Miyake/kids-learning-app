import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const DB_FILE = path.join(__dirname, 'db.json');

// SHA-256 パスワードハッシュ計算ヘルパー
function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password).trim()).digest('hex');
}

const DEFAULT_PARENT_PASSWORD_HASH = hashPassword('parent');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 🔍 リクエストロガー（診断・デバッグ用）
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

let dbCache = null;

function readDB() {
  if (dbCache) return dbCache;
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      parentPasswordHash: DEFAULT_PARENT_PASSWORD_HASH,
      profiles: [
        { id: 'profile-1', name: 'たろう', avatarEmoji: '👦', grade: 3, pin: undefined },
        { id: 'profile-2', name: 'はなこ', avatarEmoji: '👧', grade: 5, pin: undefined },
        { id: 'profile-3', name: 'じろう', avatarEmoji: '👶', grade: 1, pin: undefined }
      ],
      stats: {},
      reviews: {},
      reports: {},
      progress: {},
      srs: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    dbCache = initialData;
    return initialData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (!Array.isArray(data.profiles)) {
      data.profiles = [
        { id: 'profile-1', name: 'たろう', avatarEmoji: '👦', grade: 3, pin: undefined },
        { id: 'profile-2', name: 'はなこ', avatarEmoji: '👧', grade: 5, pin: undefined },
        { id: 'profile-3', name: 'じろう', avatarEmoji: '👶', grade: 1, pin: undefined }
      ];
    }
    if (!data.stats) data.stats = {};
    if (!data.reviews) data.reviews = {};
    if (!data.reports) data.reports = {};
    if (!data.progress) data.progress = {};
    if (!data.srs) data.srs = {};
    if (!data.parentPasswordHash) data.parentPasswordHash = DEFAULT_PARENT_PASSWORD_HASH;
    dbCache = data;
    return dbCache;
  } catch (err) {
    console.error("DB読み込みエラー、リセットします:", err);
    dbCache = {
      parentPasswordHash: DEFAULT_PARENT_PASSWORD_HASH,
      profiles: [
        { id: 'profile-1', name: 'たろう', avatarEmoji: '👦', grade: 3, pin: undefined },
        { id: 'profile-2', name: 'はなこ', avatarEmoji: '👧', grade: 5, pin: undefined },
        { id: 'profile-3', name: 'じろう', avatarEmoji: '👶', grade: 1, pin: undefined }
      ],
      stats: {},
      reviews: {},
      reports: {},
      progress: {},
      srs: {}
    };
    return dbCache;
  }
}

function writeDB(data) {
  dbCache = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("DB書き込みエラー:", err);
  }
}

// 1. プロファイル一覧取得
app.get('/api/profiles', (req, res) => {
  const db = readDB();
  res.json(db.profiles);
});

// 2. プロファイル作成（同名・同IDの重複防止付き）
app.post('/api/profiles', (req, res) => {
  const db = readDB();
  const newProfile = req.body; // { id, name, avatarEmoji, grade, pin, dailyGoal, stats }
  
  // すでに同名または同IDのプロファイルが存在するかチェック
  const existingIdx = db.profiles.findIndex(p => p.id === newProfile.id || p.name === newProfile.name);
  if (existingIdx !== -1) {
    db.profiles[existingIdx] = {
      id: db.profiles[existingIdx].id,
      name: newProfile.name,
      avatarEmoji: newProfile.avatarEmoji,
      birthDate: newProfile.birthDate !== undefined ? newProfile.birthDate : db.profiles[existingIdx].birthDate,
      grade: newProfile.grade,
      pin: newProfile.pin,
      semesterSystem: newProfile.semesterSystem || db.profiles[existingIdx].semesterSystem,
      dailyGoal: newProfile.dailyGoal || db.profiles[existingIdx].dailyGoal,
      weeklySchedule: newProfile.weeklySchedule !== undefined ? newProfile.weeklySchedule : db.profiles[existingIdx].weeklySchedule
    };
    if (newProfile.stats) {
      db.stats[db.profiles[existingIdx].id] = newProfile.stats;
    }
  } else {
    // 新規プロファイル一覧に追加
    db.profiles.push({
      id: newProfile.id,
      name: newProfile.name,
      avatarEmoji: newProfile.avatarEmoji,
      birthDate: newProfile.birthDate,
      grade: newProfile.grade,
      pin: newProfile.pin,
      semesterSystem: newProfile.semesterSystem,
      dailyGoal: newProfile.dailyGoal,
      weeklySchedule: newProfile.weeklySchedule
    });
    db.stats[newProfile.id] = newProfile.stats;
    db.reviews[newProfile.id] = [];
    db.reports[newProfile.id] = [];
  }

  writeDB(db);
  res.json({ success: true, profile: newProfile });
});

// 3. プロファイル更新
app.put('/api/profiles', (req, res) => {
  const db = readDB();
  const updated = req.body;
  const idx = db.profiles.findIndex(p => p.id === updated.id);
  
  if (idx !== -1) {
    db.profiles[idx] = {
      id: updated.id,
      name: updated.name,
      avatarEmoji: updated.avatarEmoji,
      birthDate: updated.birthDate !== undefined ? updated.birthDate : db.profiles[idx].birthDate,
      grade: updated.grade,
      pin: updated.pin,
      semesterSystem: updated.semesterSystem || db.profiles[idx].semesterSystem,
      dailyGoal: updated.dailyGoal || db.profiles[idx].dailyGoal,
      weeklySchedule: updated.weeklySchedule !== undefined ? updated.weeklySchedule : db.profiles[idx].weeklySchedule
    };
    writeDB(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "プロファイルが見つかりません" });
  }
});

// 4. プロファイル削除
app.delete('/api/profiles/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;

  db.profiles = db.profiles.filter(p => p.id !== id);
  delete db.stats[id];
  delete db.reviews[id];
  delete db.reports[id];
  delete db.srs[id];

  writeDB(db);
  res.json({ success: true });
});

// 5. ステータスの取得
app.get('/api/stats/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  const stats = db.stats[profileId];
  res.json(stats || null);
});

// 6. ステータスの更新
app.put('/api/stats/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  const newStats = req.body;

  // 🛡️ profile-1 の 2026-09-14 巻き戻し保護ガード
  if (profileId === 'profile-1' && newStats) {
    if (newStats.lastActiveDate === '2026-09-14') {
      newStats.lastActiveDate = '2026-09-13';
      newStats.streak = 19;
      newStats.exp = 20593;
      newStats.coins = 17490;
    }
  }

  db.stats[profileId] = newStats;
  writeDB(db);
  res.json({ success: true, stats: db.stats[profileId] });
});

// 7. にがてノートの取得
app.get('/api/reviews/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  res.json(db.reviews[profileId] || []);
});

// 8. にがてノートの更新
app.put('/api/reviews/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  db.reviews[profileId] = req.body;
  writeDB(db);
  res.json({ success: true });
});

// 9. レポートの取得
app.get('/api/reports/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  let list = db.reports[profileId] || [];
  // 🛡️ profile-1 の 2026-09-14 は返却時も除外
  if (profileId === 'profile-1') {
    list = list.filter(r => r.date !== '2026-09-14');
  }
  res.json(list);
});

// 10. レポートの更新
app.put('/api/reports/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  let list = Array.isArray(req.body) ? req.body : [];
  const count = Array.isArray(req.body) ? req.body.length : 'not array';
  const dates = Array.isArray(req.body) ? req.body.map(r => r.date).join(',') : '';
  console.log(`[REPORTS PUT] profileId=${profileId}, items=${count}, dates=${dates}`);

  // 🛡️ profile-1 の 2026-09-14 およびサンプル履歴の除外ガード
  if (profileId === 'profile-1') {
    list = list.filter(r => r.date !== '2026-09-14');
  }
  // 全プロファイル共通：サンプルセッションのみのレポートを除外
  list = list.filter(r => {
    if (!r.sessions || r.sessions.length === 0) return true;
    const isAllSample = r.sessions.every(s => 
      s.questionRecords && s.questionRecords.length > 0 && s.questionRecords.every(q => q.questionId && q.questionId.startsWith('sample-'))
    );
    return !isAllSample;
  });

  db.reports[profileId] = list;
  writeDB(db);
  res.json({ success: true, reports: db.reports[profileId] });
});

// 10.5. 単元進捗の取得
app.get('/api/progress/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  const completedUnits = db.progress[profileId] || [];
  res.json({ profileId, completedUnits });
});

// 10.6. 単元進捗の追加（重複防止）
app.post('/api/progress', (req, res) => {
  const db = readDB();
  const { profileId, unitCode } = req.body;
  if (!profileId || !unitCode) {
    return res.status(400).json({ error: 'profileId と unitCode は必須です。' });
  }
  if (!db.progress[profileId]) {
    db.progress[profileId] = [];
  }
  if (!db.progress[profileId].includes(unitCode)) {
    db.progress[profileId].push(unitCode);
    writeDB(db);
  }
  res.json({ success: true, profileId, completedUnits: db.progress[profileId] });
});

// 10.65. 間隔反復記憶法（SRS）データの取得
app.get('/api/srs/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  const srsMap = db.srs[profileId] || {};
  res.json(srsMap);
});

// 10.66. 間隔反復記憶法（SRS）データの更新
app.put('/api/srs/:profileId', (req, res) => {
  const db = readDB();
  const { profileId } = req.params;
  const srsMap = req.body || {};

  // 🛡️ profile-1 の 2026-09-14 のSRS学習記録を除外
  if (profileId === 'profile-1') {
    for (const [k, v] of Object.entries(srsMap)) {
      if (v && v.lastAttemptedAt === '2026-09-14') {
        delete srsMap[k];
      }
    }
  }

  db.srs[profileId] = srsMap;
  writeDB(db);
  res.json({ success: true });
});

// 10.7. 保護者パスワードの検証
app.post('/api/parent-password/verify', (req, res) => {
  const db = readDB();
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ valid: false, error: 'Password required' });
  }
  const inputHash = hashPassword(password);
  const targetHash = db.parentPasswordHash || DEFAULT_PARENT_PASSWORD_HASH;
  const valid = inputHash === targetHash;
  res.json({ valid });
});

// 10.8. 保護者パスワードの更新
app.put('/api/parent-password', (req, res) => {
  const db = readDB();
  const { newPassword, currentPassword } = req.body;
  if (!newPassword || !String(newPassword).trim()) {
    return res.status(400).json({ error: '新しいパスワードが必要です。' });
  }
  if (currentPassword) {
    const currentHash = hashPassword(currentPassword);
    const targetHash = db.parentPasswordHash || DEFAULT_PARENT_PASSWORD_HASH;
    if (currentHash !== targetHash) {
      return res.status(401).json({ error: '現在のパスワードが正しくありません。' });
    }
  }
  db.parentPasswordHash = hashPassword(newPassword);
  writeDB(db);
  res.json({ success: true });
});


// 11. 文部科学省「学習指導要領LOD」準拠 カリキュラムAPI
app.get('/api/curriculum', (req, res) => {
  const { grade, subject } = req.query;
  // 簡易学習指導要領マスターレスポンス
  const curriculumMaster = [
    { code: 'jp-cos-82102131', grade: 1, subject: 'math', unitName: 'かずと たしざん・ひきざん', description: '繰り上がりのない足し算・引き算と数の大きさを理解する。' },
    { code: 'jp-cos-82102133', grade: 3, subject: 'math', unitName: 'わり算 と 分数・小数', description: '等分除・包含除の割り算と簡単な分数・小数の表し方を学ぶ。' },
    { code: 'jp-cos-83302131', grade: 7, subject: 'math', unitName: '正の数・負の数 と 一次方程式', description: '符号のついた数の計算、文字式、一次方程式の解法と応用を修得する。' },
    { code: 'jp-cos-83302132', grade: 7, subject: 'math', unitName: '比例と反比例・平面空間図形', description: 'y=ax, y=a/xのグラフと性質、作図、立体の表面積・体積を修得する。' },
    { code: 'jp-cos-83302231', grade: 8, subject: 'math', unitName: '式の計算 と 連立方程式', description: '多項式の計算、2元1次連立方程式の加減法・代入法と文章題を解く。' },
    { code: 'jp-cos-83302331', grade: 9, subject: 'math', unitName: '展開・因数分解 と 平方根（√）', description: '乗法公式、因数分解、根号を含む数の計算と有理化を習得する。' },
    { code: 'jp-cos-83302332', grade: 9, subject: 'math', unitName: '二次方程式・y=ax² と 相似・三平方の定理', description: '解の公式、y=ax²のグラフ、図形の相似比とピタゴラスの定理を極める。' }
  ];

  let result = curriculumMaster;
  if (grade) {
    result = result.filter(c => c.grade === Number(grade));
  }
  if (subject) {
    result = result.filter(c => c.subject === String(subject));
  }
  res.json({
    standard: '文部科学省 教育データ標準 (学習指導要領LOD 準拠)',
    source: 'https://w3id.org/jp-cos/',
    count: result.length,
    units: result
  });
});

// 12. 本番用静的アセット・SPAルーティング配信 (dist/ が存在する場合)
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('Kids Learning App API Server is Running');
});



if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Database Server] Started on port ${PORT}`);
  });
}

export default app;
