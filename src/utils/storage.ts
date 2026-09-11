import type { UserProfile, UserStats, ReviewItem, DailyReport, Subject, DailyGoal, QuizSession, SemesterSystem, Question, QuestionSRSItem, SessionQuestionRecord } from '../types';
import { evaluateSRSAnswer, generateQuestionKey } from './spacedRepetition';
import { calculateGradeFromBirthDate } from './gradeCalculator';

const PROFILES_KEY = 'kids_learnquest_profiles_list';
const ACTIVE_PROFILE_KEY = 'kids_learnquest_active_profile_id';
const PARENT_PASSWORD_KEY = 'kids_learnquest_parent_master_password';


const createInitialStats = (): UserStats => ({
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  coins: 50,
  streak: 0,
  lastActiveDate: null,
  unlockedBadges: [],
  equippedAvatar: {
    base: 'base-boy',
    hat: 'hat-none',
    accessory: 'acc-none',
    companion: 'comp-none'
  },
  ownedItems: ['base-boy', 'base-girl', 'hat-none', 'acc-none', 'comp-none']
});

const defaultDailyGoal = {
  targetQuestions: 5,
  targetMinutes: 10,
  rewardText: '🎮 ゲーム30分OK！'
};

const defaultProfiles: UserProfile[] = [
  { id: 'profile-1', name: 'たろう', avatarEmoji: '👦', grade: 3, dailyGoal: defaultDailyGoal, stats: createInitialStats() },
  { id: 'profile-2', name: 'はなこ', avatarEmoji: '👧', grade: 5, dailyGoal: defaultDailyGoal, stats: createInitialStats() },
  { id: 'profile-3', name: 'じろう', avatarEmoji: '👶', grade: 1, dailyGoal: defaultDailyGoal, stats: createInitialStats() }
];

export const storage = {
  // サーバー上のデータベースとローカルを同期させる
  async syncFromServer(): Promise<void> {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) return;
      const serverProfiles: UserProfile[] = await res.json();
      
      if (serverProfiles && serverProfiles.length > 0) {
        // ローカルストレージにのみ存在する未同期プロファイルがあればサーバーへ自動送信してマージ保護
        const localProfiles = storage.getProfiles();
        const unsyncedLocal = localProfiles.filter(lp => !serverProfiles.some(sp => sp.id === lp.id));

        if (unsyncedLocal.length > 0) {
          for (const newP of unsyncedLocal) {
            try {
              await fetch('/api/profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newP)
              });
              if (newP.stats) {
                await fetch(`/api/stats/${newP.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newP.stats)
                });
              }
              serverProfiles.push(newP);
            } catch (err) {
              console.warn("ローカルプロファイルのサーバー自動マージ失敗:", err);
            }
          }
        }

        // 各プロファイルの進捗データ（stats, reviews, reports）も同期取得し、Localと安全マージ
        const updatedProfiles = await Promise.all(
          serverProfiles.map(async (p) => {
            const localP = localProfiles.find(lp => lp.id === p.id);
            const localStatsStr = localStorage.getItem(`kids_learnquest_stats_${p.id}`);
            const localStats: UserStats | null = localStatsStr ? JSON.parse(localStatsStr) : (localP?.stats || null);

            // ステータス取得
            const statsRes = await fetch(`/api/stats/${p.id}`);
            const serverStats: UserStats | null = statsRes.ok ? await statsRes.json() : null;

            const serverEquipped = serverStats?.equippedAvatar;
            const localEquipped = localStats?.equippedAvatar;

            const finalEquipped = {
              base: (serverEquipped?.base && serverEquipped.base !== 'base-boy' && serverEquipped.base !== 'base-girl')
                ? serverEquipped.base
                : (localEquipped?.base || serverEquipped?.base || 'base-boy'),

              hat: (serverEquipped?.hat && serverEquipped.hat !== 'hat-none')
                ? serverEquipped.hat
                : (localEquipped?.hat || serverEquipped?.hat || 'hat-none'),

              accessory: (serverEquipped?.accessory && serverEquipped.accessory !== 'acc-none')
                ? serverEquipped.accessory
                : (localEquipped?.accessory || serverEquipped?.accessory || 'acc-none'),

              companion: (serverEquipped?.companion && serverEquipped.companion !== 'comp-none')
                ? serverEquipped.companion
                : (localEquipped?.companion || serverEquipped?.companion || 'comp-none')
            };

            // 🌟 レベル・Exp・コイン・所持アイテム等の「最高進捗」を完全保護・マージ
            const finalStats: UserStats = {
              level: Math.max(serverStats?.level || 1, localStats?.level || 1),
              exp: Math.max(serverStats?.exp || 0, localStats?.exp || 0),
              nextLevelExp: Math.max(serverStats?.nextLevelExp || 100, localStats?.nextLevelExp || 100),
              coins: Math.max(serverStats?.coins || 50, localStats?.coins || 50),
              streak: Math.max(serverStats?.streak || 0, localStats?.streak || 0),
              lastActiveDate: serverStats?.lastActiveDate || localStats?.lastActiveDate || null,
              unlockedBadges: Array.from(new Set([...(serverStats?.unlockedBadges || []), ...(localStats?.unlockedBadges || [])])),
              equippedAvatar: finalEquipped,
              ownedItems: Array.from(new Set([...(serverStats?.ownedItems || []), ...(localStats?.ownedItems || [])]))
            };
            
            // 苦手ノート取得・マージ
            const reviewsRes = await fetch(`/api/reviews/${p.id}`);
            const serverReviews: ReviewItem[] = reviewsRes.ok ? await reviewsRes.json() : [];
            const localReviewsStr = localStorage.getItem(`kids_learnquest_review_${p.id}`);
            const localReviews: ReviewItem[] = localReviewsStr ? JSON.parse(localReviewsStr) : [];
            const mergedReviews = [...serverReviews];
            localReviews.forEach(lr => {
              if (!mergedReviews.some(sr => sr.questionId === lr.questionId)) {
                mergedReviews.push(lr);
              }
            });
            
            // レポート取得・マージ
            const reportsRes = await fetch(`/api/reports/${p.id}`);
            const serverReports: DailyReport[] = reportsRes.ok ? await reportsRes.json() : [];
            const localReportsStr = localStorage.getItem(`kids_learnquest_reports_${p.id}`);
            const localReports: DailyReport[] = localReportsStr ? JSON.parse(localReportsStr) : [];
            const mergedReports = [...serverReports];
            localReports.forEach(lr => {
              if (!mergedReports.some(sr => sr.date === lr.date)) {
                mergedReports.push(lr);
              }
            });

            // SRS（記憶定着）データ取得・マージ
            const srsRes = await fetch(`/api/srs/${p.id}`);
            const serverSRS: Record<string, QuestionSRSItem> = srsRes.ok ? await srsRes.json() : {};
            const localSRSStr = localStorage.getItem(`kids_learnquest_srs_${p.id}`);
            const localSRS: Record<string, QuestionSRSItem> = localSRSStr ? JSON.parse(localSRSStr) : {};
            const mergedSRS: Record<string, QuestionSRSItem> = { ...serverSRS, ...localSRS };
            // 両方に存在する場合はよりステージが進んでいる方または新しい解答を優先
            Object.keys(serverSRS).forEach(k => {
              if (localSRS[k]) {
                const sItem = serverSRS[k];
                const lItem = localSRS[k];
                if (sItem.stage > lItem.stage || (sItem.stage === lItem.stage && sItem.totalAttempts > lItem.totalAttempts)) {
                  mergedSRS[k] = sItem;
                } else {
                  mergedSRS[k] = lItem;
                }
              }
            });

            // LocalStorage に即時キャッシュ保存
            localStorage.setItem(`kids_learnquest_stats_${p.id}`, JSON.stringify(finalStats));
            localStorage.setItem(`kids_learnquest_review_${p.id}`, JSON.stringify(mergedReviews));
            localStorage.setItem(`kids_learnquest_reports_${p.id}`, JSON.stringify(mergedReports));
            localStorage.setItem(`kids_learnquest_srs_${p.id}`, JSON.stringify(mergedSRS));

            // サーバー側へ最新の最高進捗データを逆同期バックアップ保存
            fetch(`/api/stats/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(finalStats)
            }).catch(() => {});
            fetch(`/api/srs/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mergedSRS)
            }).catch(() => {});

            // 🎯 ノルマ設定(dailyGoal)は保護者変更のサーバー最新値を最優先（デフォルト ➔ ローカル ➔ サーバー）
            const mergedGoal: DailyGoal = {
              ...(defaultDailyGoal),
              ...(localP?.dailyGoal || {}),
              ...(p.dailyGoal || {})
            };

            return {
              ...p,
              name: p.name || localP?.name || '',
              avatarEmoji: p.avatarEmoji || localP?.avatarEmoji || '🧑‍🚀',
              birthDate: p.birthDate !== undefined ? p.birthDate : localP?.birthDate,
              pin: p.pin !== undefined ? p.pin : localP?.pin,
              grade: p.grade || localP?.grade || 3,
              dailyGoal: mergedGoal,
              semesterSystem: p.semesterSystem || localP?.semesterSystem,
              stats: finalStats
            };
          })
        );

        // 🌟 プロファイルの重複排除（同名または同IDの重複プロファイルを一貫排除）
        const uniqueProfiles: UserProfile[] = [];
        const seenNames = new Set<string>();
        const seenIds = new Set<string>();

        for (const prof of updatedProfiles) {
          if (!seenIds.has(prof.id) && !seenNames.has(prof.name)) {
            seenIds.add(prof.id);
            seenNames.add(prof.name);
            uniqueProfiles.push(prof);
          }
        }

        localStorage.setItem(PROFILES_KEY, JSON.stringify(uniqueProfiles));
        
        // アクティブIDの保証
        const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
        if (!activeId || !uniqueProfiles.some(p => p.id === activeId)) {
          localStorage.setItem(ACTIVE_PROFILE_KEY, uniqueProfiles[0].id);
        }
        console.log("[Database Sync] 同期に成功しました！");
      }
    } catch (err) {
      console.warn("[Database Sync] サーバーと接続できません。ローカルモードで動作します:", err);
    }
  },

  // プロファイル一覧の取得（生年月日に基づく学年自動進級チェック付き）
  getProfiles(): UserProfile[] {
    const data = localStorage.getItem(PROFILES_KEY);
    if (!data) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, defaultProfiles[0].id);
      return defaultProfiles;
    }
    try {
      const parsed: UserProfile[] = JSON.parse(data);
      let hasUpdates = false;

      const sanitized = parsed.map((p, idx) => {
        let currentGrade = p.grade || defaultProfiles[idx % defaultProfiles.length]?.grade || 3;
        
        // 生年月日が登録されている場合、現在の年度に基づく学年を自動算出・自動進級
        if (p.birthDate) {
          const calculated = calculateGradeFromBirthDate(p.birthDate);
          if (calculated.isSchoolAge && calculated.grade !== currentGrade) {
            currentGrade = calculated.grade;
            hasUpdates = true;
          }
        }

        return {
          ...p,
          avatarEmoji: p.avatarEmoji || defaultProfiles[idx % defaultProfiles.length]?.avatarEmoji || '🧑‍🚀',
          grade: currentGrade,
          dailyGoal: p.dailyGoal || defaultDailyGoal
        };
      });

      if (hasUpdates) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(sanitized));
      }

      return sanitized;
    } catch {
      return defaultProfiles;
    }
  },

  // アクティブなプロファイルIDの取得
  getActiveProfileId(): string {
    const profiles = this.getProfiles();
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (activeId && profiles.some(p => p.id === activeId)) {
      return activeId;
    }
    return profiles[0].id;
  },

  // アクティブなプロファイルの切り替え
  setActiveProfileId(id: string): void {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  },

  // 現在のアクティブプロファイル取得
  getActiveProfile(): UserProfile {
    const profiles = this.getProfiles();
    const activeId = this.getActiveProfileId();
    const profile = profiles.find(p => p.id === activeId) || profiles[0];
    profile.stats = this.getStats(profile.id);
    return profile;
  },

  // プロファイル一覧の保存
  saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  },

  // 指定IDのプロファイル取得
  getProfile(id: string): UserProfile | undefined {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === id);
  },

  // プロファイルの追加
  addProfile(
    name: string,
    avatarEmoji: string,
    grade: number = 3,
    pin?: string,
    dailyGoal?: DailyGoal,
    semesterSystem?: SemesterSystem,
    birthDate?: string
  ): UserProfile {
    const profiles = this.getProfiles();
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: name.trim() || 'チャレンジャー',
      avatarEmoji: avatarEmoji || '🧑‍🚀',
      birthDate,
      grade: grade || 3,
      pin: pin ? pin.trim() : undefined,
      dailyGoal: dailyGoal || { ...defaultDailyGoal },
      semesterSystem,
      stats: createInitialStats()
    };
    
    // 1. ローカル保存
    const updated = [...profiles, newProfile];
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    this.saveStats(newProfile.stats, newProfile.id);

    // 2. サーバーDBへ非同期送信
    fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    }).catch(err => console.warn("サーバー保存エラー:", err));

    return newProfile;
  },

  // プロファイルの作成 (addProfileのエイリアス/互換用)
  createProfile(
    name: string,
    avatarEmoji: string,
    grade: number = 3,
    pin?: string,
    dailyGoal?: DailyGoal,
    semesterSystem?: SemesterSystem
  ): UserProfile {
    return this.addProfile(name, avatarEmoji, grade, pin, dailyGoal, semesterSystem);
  },

  // プロファイルの更新 (PIN設定・名前・学年変更など)
  updateProfile(updatedProfile: UserProfile): void {
    // 1. ローカル保存
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === updatedProfile.id);
    if (index !== -1) {
      profiles[index] = updatedProfile;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    // 2. サーバーDBへ非同期送信
    fetch('/api/profiles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProfile)
    }).catch(err => console.warn("サーバー更新エラー:", err));
  },

  // プロファイルの削除
  deleteProfile(id: string): void {
    const profiles = this.getProfiles();
    if (profiles.length <= 1) {
      alert('少なくとも1つのプロファイルが必要です。');
      return;
    }
    // 1. ローカル削除
    const updated = profiles.filter(p => p.id !== id);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    
    localStorage.removeItem(`kids_learnquest_stats_${id}`);
    localStorage.removeItem(`kids_learnquest_review_${id}`);
    localStorage.removeItem(`kids_learnquest_reports_${id}`);
    localStorage.removeItem(`kids_learnquest_srs_${id}`);

    if (this.getActiveProfileId() === id) {
      this.setActiveProfileId(updated[0].id);
    }

    // 2. サーバーDBへ非同期送信
    fetch(`/api/profiles/${id}`, {
      method: 'DELETE'
    }).catch(err => console.warn("サーバー削除エラー:", err));
  },

  // プレイヤー統計の取得（プロファイル単位）
  getStats(profileId?: string): UserStats {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_stats_${targetId}`;
    const data = localStorage.getItem(key);
    if (!data) return createInitialStats();
    try {
      return { ...createInitialStats(), ...JSON.parse(data) };
    } catch {
      return createInitialStats();
    }
  },

  // プレイヤー統計の保存（プロファイル単位）
  saveStats(stats: UserStats, profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_stats_${targetId}`;
    
    // 1. ローカル保存
    localStorage.setItem(key, JSON.stringify(stats));

    const profiles = storage.getProfiles();
    const target = profiles.find(p => p.id === targetId);
    if (target) {
      target.stats = stats;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    // 2. サーバーDBへ非同期送信
    fetch(`/api/stats/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    }).catch(err => console.warn("統計サーバー保存エラー:", err));
  },

  // 苦手問題ノートの取得（プロファイル単位）
  getReviewItems(profileId?: string): ReviewItem[] {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_review_${targetId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // 苦手問題ノートに新規登録
  addReviewItem(item: Omit<ReviewItem, 'addedAt'>, profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_review_${targetId}`;
    const items = storage.getReviewItems(targetId);
    if (items.some(i => i.questionId === item.questionId)) return;
    const newItem: ReviewItem = {
      ...item,
      addedAt: new Date().toISOString()
    };
    
    // 1. ローカル保存
    const updated = [newItem, ...items];
    localStorage.setItem(key, JSON.stringify(updated));

    // 2. サーバーDBへ非同期送信
    fetch(`/api/reviews/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => console.warn("苦手ノートサーバー保存エラー:", err));
  },

  // 苦手問題ノートから削除
  removeReviewItem(questionId: string, profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_review_${targetId}`;
    const items = storage.getReviewItems(targetId);
    const filtered = items.filter(i => i.questionId !== questionId);
    
    // 1. ローカル保存
    localStorage.setItem(key, JSON.stringify(filtered));

    // 2. サーバーDBへ非同期送信
    fetch(`/api/reviews/${targetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered)
    }).catch(err => console.warn("苦手ノートサーバー削除エラー:", err));
  },

  // 🧠 間隔反復記憶法 (SRS) データの取得
  getSRSData(profileId?: string): Record<string, QuestionSRSItem> {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_srs_${targetId}`;
    const data = localStorage.getItem(key);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  // 🧠 間隔反復記憶法 (SRS) データの保存
  saveSRSData(srsData: Record<string, QuestionSRSItem>, profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_srs_${targetId}`;

    // 1. ローカル保存
    localStorage.setItem(key, JSON.stringify(srsData));

    // 2. サーバーDBへ非同期送信
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
      try {
        fetch(`/api/srs/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(srsData)
        }).catch(() => { /* オフライン/テスト時の無効URLを無視 */ });
      } catch {
        /* 無効URL等を安全にキャッチ */
      }
    }
  },

  // 🧠 解答結果に応じた1問のSRS更新
  updateQuestionSRS(
    question: Question,
    isCorrect: boolean,
    profileId?: string,
    nowStr?: string
  ): QuestionSRSItem {
    const targetId = profileId || storage.getActiveProfileId();
    const srsData = this.getSRSData(targetId);
    const key = generateQuestionKey(question);
    const currentItem = srsData[key];

    const updatedItem = evaluateSRSAnswer(question, currentItem, isCorrect, nowStr);
    srsData[key] = updatedItem;

    this.saveSRSData(srsData, targetId);
    return updatedItem;
  },

  // 学習レポート取得（プロファイル単位）
  getReports(profileId?: string): DailyReport[] {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // 学習レポートの更新
  addReportData(
    subject: string,
    correct: boolean | number,
    timeSpentSeconds: number,
    profileId?: string,
    totalAttempted?: number,
    sessionDetails?: {
      grade?: number;
      unitName?: string;
      sessionType?: 'quiz' | 'exam';
      questionRecords?: SessionQuestionRecord[];
    }
  ): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    const reports = storage.getReports(targetId);
    const todayStr = new Date().toISOString().split('T')[0];

    let todayReport = reports.find(r => r.date === todayStr);

    if (!todayReport) {
      todayReport = {
        date: todayStr,
        subjectMinutes: { math: 0, japanese: 0, science: 0, social: 0, english: 0 },
        questionsAttempted: 0,
        questionsCorrect: 0,
        subjectBreakdown: {},
        sessions: []
      };
      reports.push(todayReport);
    }

    const attempted = totalAttempted !== undefined
      ? totalAttempted
      : (typeof correct === 'number' ? correct : 1);
    const correctNum = typeof correct === 'number' ? correct : (correct ? attempted : 0);

    todayReport.questionsAttempted += attempted;
    todayReport.questionsCorrect += correctNum;
    todayReport.totalQuestions = todayReport.questionsAttempted;

    const subjectKey = subject as Subject;
    const durationMinutes = timeSpentSeconds / 60;

    if (todayReport.subjectMinutes[subjectKey] !== undefined) {
      todayReport.subjectMinutes[subjectKey] += durationMinutes;
    } else {
      todayReport.subjectMinutes[subjectKey] = durationMinutes;
    }

    if (!todayReport.subjectBreakdown) {
      todayReport.subjectBreakdown = {};
    }
    if (!todayReport.subjectBreakdown[subjectKey]) {
      todayReport.subjectBreakdown[subjectKey] = { total: 0, correct: 0 };
    }
    todayReport.subjectBreakdown[subjectKey]!.total += attempted;
    todayReport.subjectBreakdown[subjectKey]!.correct =
      (todayReport.subjectBreakdown[subjectKey]!.correct || 0) + correctNum;

    if (!todayReport.sessions) {
      todayReport.sessions = [];
    }
    const session: QuizSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject: subjectKey,
      grade: sessionDetails?.grade,
      unitName: sessionDetails?.unitName || '全般（ランダム）',
      sessionType: sessionDetails?.sessionType || 'quiz',
      questionsAttempted: attempted,
      questionsCorrect: correctNum,
      durationMinutes,
      durationSeconds: timeSpentSeconds,
      timestamp: new Date().toISOString(),
      questionRecords: sessionDetails?.questionRecords || []
    };
    todayReport.sessions.push(session);

    // 1. ローカル保存
    localStorage.setItem(key, JSON.stringify(reports));

    // 2. サーバーDBへ非同期送信
    try {
      if (typeof window !== 'undefined' && window.location) {
        fetch(`/api/reports/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reports)
        }).catch(err => console.warn("レポートサーバー更新エラー:", err));
      }
    } catch (err) {
      console.warn("レポートサーバー送信例外:", err);
    }
  },

  // 🧪 動作確認・デモ用サンプル学習データの投入
  addSampleReportData(profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();

    // 算数クイズセッション（5問中4問正解、1問不正解）
    this.addReportData('math', 4, 180, targetId, 5, {
      unitName: '九九・かけ算',
      sessionType: 'quiz',
      questionRecords: [
        {
          questionId: 'sample-math-1',
          questionText: '3 × 4 は いくらかな？',
          selectedAnswer: '12',
          correctAnswer: '12',
          isCorrect: true,
          explanation: '3 × 4 = 12 です。'
        },
        {
          questionId: 'sample-math-2',
          questionText: '7 × 8 は いくらかな？',
          selectedAnswer: '54',
          correctAnswer: '56',
          isCorrect: false,
          explanation: '7 × 8 = 56 です。7の段をもう一度復習してみよう！'
        },
        {
          questionId: 'sample-math-3',
          questionText: '6 × 9 は いくらかな？',
          selectedAnswer: '54',
          correctAnswer: '54',
          isCorrect: true,
          explanation: '6 × 9 = 54 です。'
        },
        {
          questionId: 'sample-math-4',
          questionText: '8 × 4 は いくらかな？',
          selectedAnswer: '32',
          correctAnswer: '32',
          isCorrect: true,
          explanation: '8 × 4 = 32 です。'
        },
        {
          questionId: 'sample-math-5',
          questionText: '9 × 9 は いくらかな？',
          selectedAnswer: '81',
          correctAnswer: '81',
          isCorrect: true,
          explanation: '9 × 9 = 81 です。'
        }
      ]
    });

    // 国語単元テストセッション（3問全問正解）
    this.addReportData('japanese', 3, 120, targetId, 3, {
      unitName: '漢字の読み書き',
      sessionType: 'exam',
      questionRecords: [
        {
          questionId: 'sample-jp-1',
          questionText: '「山」の訓読み（くんよみ）は？',
          selectedAnswer: 'やま',
          correctAnswer: 'やま',
          isCorrect: true,
          explanation: '山（やま）と読みます。'
        },
        {
          questionId: 'sample-jp-2',
          questionText: '「川」の音読み（おんよみ）は？',
          selectedAnswer: 'セン',
          correctAnswer: 'セン',
          isCorrect: true,
          explanation: '河川（かせん）の「セン」です。'
        },
        {
          questionId: 'sample-jp-3',
          questionText: '反対の言葉：「大きい」の反対は？',
          selectedAnswer: '小さい',
          correctAnswer: '小さい',
          isCorrect: true,
          explanation: '「大きい」の反対は「小さい」です。'
        }
      ]
    });
  },

  // 🧹 学習レポートの全削除（プロファイル単位）
  clearReports(profileId?: string): void {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    localStorage.removeItem(key);
    try {
      if (typeof window !== 'undefined' && window.location) {
        fetch(`/api/reports/${targetId}`, {
          method: 'DELETE'
        }).catch(() => {});
      }
    } catch {}
  },

  // ストリークの更新判定（プロファイル単位）
  checkAndUpdateStreak(profileId?: string): number {
    const targetId = profileId || storage.getActiveProfileId();
    const stats = storage.getStats(targetId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (!stats.lastActiveDate) {
      stats.streak = 1;
      stats.lastActiveDate = todayStr;
      storage.saveStats(stats, targetId);
      return 1;
    }

    const lastDate = new Date(stats.lastActiveDate);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.streak += 1;
      stats.lastActiveDate = todayStr;
      storage.saveStats(stats, targetId);
    } else if (diffDays > 1) {
      stats.streak = 1;
      stats.lastActiveDate = todayStr;
      storage.saveStats(stats, targetId);
    }

    return stats.streak;
  },

  // 保護者マスターパスワードの取得 (デフォルト: 'parent')
  getParentPassword(): string {
    const saved = localStorage.getItem(PARENT_PASSWORD_KEY);
    return saved || 'parent';
  },

  // 保護者マスターパスワードの更新 (ローカル保存 ＋ サーバーDB永続化)
  setParentPassword(newPassword: string): void {
    if (!newPassword || !newPassword.trim()) return;
    const trimmed = newPassword.trim();
    localStorage.setItem(PARENT_PASSWORD_KEY, trimmed);

    // サーバーDBへ非同期送信（SHA-256ハッシュ化して保存される）
    if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
      try {
        fetch('/api/parent-password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: trimmed })
        }).catch(() => { /* オフライン/テスト時の無効URLを無視 */ });
      } catch {
        /* 無効URL等を安全にキャッチ */
      }
    }
  },

  // 保護者マスターパスワードの検証 (同期)
  verifyParentPassword(inputPassword: string): boolean {
    const current = storage.getParentPassword();
    return current === inputPassword.trim();
  },

  // 保護者マスターパスワードの検証 (非同期 / サーバーDB照合対応)
  async verifyParentPasswordAsync(inputPassword: string): Promise<boolean> {
    const trimmed = inputPassword.trim();
    try {
      const res = await fetch('/api/parent-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          localStorage.setItem(PARENT_PASSWORD_KEY, trimmed);
          return true;
        }
        return false;
      }
    } catch {
      // ネットワーク接続エラー・オフライン時はローカルデータでフォールバック検証
    }
    return this.verifyParentPassword(trimmed);
  }
};

