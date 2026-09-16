import type { UserProfile, UserStats, ReviewItem, DailyReport, Subject, DailyGoal, QuizSession, SemesterSystem, Question, QuestionSRSItem, SessionQuestionRecord, WeeklySchedule } from '../types';
import { evaluateSRSAnswer, generateQuestionKey } from './spacedRepetition';
import { calculateGradeFromBirthDate } from './gradeCalculator';

const PROFILES_KEY = 'kids_learnquest_profiles_list';
const ACTIVE_PROFILE_KEY = 'kids_learnquest_active_profile_id';
const PARENT_PASSWORD_KEY = 'kids_learnquest_parent_master_password';
const PARENT_SESSION_KEY = 'kids_learnquest_parent_auth_session';


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

// 🧪 サンプル学習データのセッション判定（誤投入データの自動クリーンアップ用）
export function isSampleSession(session: QuizSession): boolean {
  if (!session) return false;
  if (session.questionRecords && session.questionRecords.some(q => q.questionId && q.questionId.startsWith('sample-'))) {
    return true;
  }
  if (session.unitName === '九九・かけ算' || session.unitName === '漢字の読み書き') {
    if (session.questionRecords && session.questionRecords.some(q =>
      q.questionText?.includes('3 × 4') ||
      q.questionText?.includes('「山」の訓読み')
    )) {
      return true;
    }
  }
  return false;
}

// 🧹 レポート配列からサンプル履歴を自動検出・完全除去＆再集計
export function sanitizeReports(reports: DailyReport[]): DailyReport[] {
  if (!Array.isArray(reports)) return [];
  const result: DailyReport[] = [];

  for (const report of reports) {
    if (!report.sessions || report.sessions.length === 0) {
      result.push(report);
      continue;
    }

    const validSessions = report.sessions.filter(s => !isSampleSession(s));

    // サンプルセッションが含まれていた場合
    if (validSessions.length < report.sessions.length) {
      // 有効なセッションが残っていない場合（サンプルデータのみで構成されたレポート）
      if (validSessions.length === 0) {
        // レポートから除外（未学習としてリセット）
        continue;
      }

      // 有効なセッションが残っている場合は、本物のセッションのみで再集計
      let questionsAttempted = 0;
      let questionsCorrect = 0;
      const subjectMinutes: Record<Subject, number> = { math: 0, japanese: 0, science: 0, social: 0, english: 0 };
      const subjectBreakdown: Partial<Record<Subject, { total: number; correct?: number }>> = {};

      validSessions.forEach(sess => {
        questionsAttempted += (sess.questionsAttempted || 0);
        questionsCorrect += (sess.questionsCorrect || 0);
        if (sess.subject) {
          subjectMinutes[sess.subject] = (subjectMinutes[sess.subject] || 0) + (sess.durationMinutes || 0);
          if (!subjectBreakdown[sess.subject]) {
            subjectBreakdown[sess.subject] = { total: 0, correct: 0 };
          }
          subjectBreakdown[sess.subject]!.total += (sess.questionsAttempted || 0);
          subjectBreakdown[sess.subject]!.correct = (subjectBreakdown[sess.subject]!.correct || 0) + (sess.questionsCorrect || 0);
        }
      });

      result.push({
        ...report,
        questionsAttempted,
        questionsCorrect,
        totalQuestions: questionsAttempted,
        subjectMinutes,
        subjectBreakdown,
        sessions: validSessions
      });
    } else {
      result.push(report);
    }
  }

  return result;
}

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
            
            // レポート取得・マージ（セッション単位での完全マージ＆データ消失防止）
            const reportsRes = await fetch(`/api/reports/${p.id}`);
            const serverReports: DailyReport[] = reportsRes.ok ? await reportsRes.json() : [];
            const localReportsStr = localStorage.getItem(`kids_learnquest_reports_${p.id}`);
            const localReports: DailyReport[] = localReportsStr ? JSON.parse(localReportsStr) : [];

            // 全日付を収集して日ごとに正しくセッションをマージ
            const allDates = Array.from(new Set([
              ...serverReports.map(r => r.date),
              ...localReports.map(r => r.date)
            ]));

            const mergedReports: DailyReport[] = allDates.map(date => {
              const sr = serverReports.find(r => r.date === date);
              const lr = localReports.find(r => r.date === date);

              if (sr && !lr) return sr;
              if (!sr && lr) return lr;

              // サーバーとローカルの両方に同一日付のレポートがある場合
              // セッションIDまたはタイムスタンプをキーにして重複なく結合
              const sessionMap = new Map<string, QuizSession>();
              (sr?.sessions || []).forEach(sess => sessionMap.set(sess.id || `${sess.subject}-${sess.timestamp}`, sess));
              (lr?.sessions || []).forEach(sess => sessionMap.set(sess.id || `${sess.subject}-${sess.timestamp}`, sess));

              const combinedSessions = Array.from(sessionMap.values());

              if (combinedSessions.length > 0) {
                let questionsAttempted = 0;
                let questionsCorrect = 0;
                const subjectMinutes: Record<Subject, number> = { math: 0, japanese: 0, science: 0, social: 0, english: 0 };
                const subjectBreakdown: Partial<Record<Subject, { total: number; correct?: number }>> = {};

                combinedSessions.forEach(sess => {
                  questionsAttempted += sess.questionsAttempted;
                  questionsCorrect += sess.questionsCorrect;
                  if (sess.subject) {
                    subjectMinutes[sess.subject] = (subjectMinutes[sess.subject] || 0) + (sess.durationMinutes || 0);
                    if (!subjectBreakdown[sess.subject]) {
                      subjectBreakdown[sess.subject] = { total: 0, correct: 0 };
                    }
                    subjectBreakdown[sess.subject]!.total += sess.questionsAttempted;
                    subjectBreakdown[sess.subject]!.correct = (subjectBreakdown[sess.subject]!.correct || 0) + sess.questionsCorrect;
                  }
                });

                return {
                  date,
                  questionsAttempted,
                  questionsCorrect,
                  totalQuestions: questionsAttempted,
                  subjectMinutes,
                  subjectBreakdown,
                  sessions: combinedSessions
                };
              }

              // セッション情報のない旧データは解いた問題数が多い方を優先
              return (lr!.questionsAttempted >= sr!.questionsAttempted) ? lr! : sr!;
            });

            const todayStr = new Date().toISOString().split('T')[0];
            const todayReport = mergedReports.find(r => r.date === todayStr);
            console.log(`[Quiz Progress] レポート同期完了: [${p.id}] (本日累計: ${todayReport?.questionsAttempted || 0}問, 解答時間: ${Math.round((todayReport?.subjectMinutes ? Object.values(todayReport.subjectMinutes).reduce((a, b) => a + (b || 0), 0) : 0) * 10) / 10}分)`);

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

            // 🧹 サンプルデータのパージ
            const cleanReports = sanitizeReports(mergedReports);

            // LocalStorage に即時キャッシュ保存
            localStorage.setItem(`kids_learnquest_stats_${p.id}`, JSON.stringify(finalStats));
            localStorage.setItem(`kids_learnquest_review_${p.id}`, JSON.stringify(mergedReviews));
            localStorage.setItem(`kids_learnquest_reports_${p.id}`, JSON.stringify(cleanReports));
            localStorage.setItem(`kids_learnquest_reports_backup_${p.id}`, JSON.stringify(cleanReports));
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
            fetch(`/api/reports/${p.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cleanReports)
            }).catch(() => {});

            // 🎯 ノルマ設定(dailyGoal)はローカルで新しく変更されたものを優先・安全マージ
            const mergedGoal: DailyGoal = {
              ...(defaultDailyGoal),
              ...(p.dailyGoal || {}),
              ...(localP?.dailyGoal || {})
            };

            const mergedWeeklySchedule: WeeklySchedule | undefined =
              p.weeklySchedule !== undefined
                ? p.weeklySchedule
                : localP?.weeklySchedule;

            return {
              ...p,
              name: p.name || localP?.name || '',
              avatarEmoji: p.avatarEmoji || localP?.avatarEmoji || '🧑‍🚀',
              birthDate: p.birthDate !== undefined ? p.birthDate : localP?.birthDate,
              pin: p.pin !== undefined ? p.pin : localP?.pin,
              grade: p.grade || localP?.grade || 3,
              dailyGoal: mergedGoal,
              weeklySchedule: mergedWeeklySchedule,
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

  // 学習レポート取得（プロファイル単位・バックアップ自動復旧ガード付き・サンプル自動サニタイズ）
  getReports(profileId?: string): DailyReport[] {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    const backupKey = `kids_learnquest_reports_backup_${targetId}`;
    const data = localStorage.getItem(key);

    let parsedReports: DailyReport[] | null = null;

    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedReports = parsed;
        }
      } catch {
        // パースエラー時はバックアップからの復旧へ
      }
    }

    // 通常キーが空・破損の場合、バックアップから自動復旧
    if (!parsedReports) {
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const parsedBackup = JSON.parse(backupData);
          if (Array.isArray(parsedBackup) && parsedBackup.length > 0) {
            parsedReports = parsedBackup;
            localStorage.setItem(key, backupData);
            console.warn(`[Quiz Progress] 学習レポートをバックアップから自動復旧しました: [${targetId}]`);
          }
        } catch {}
      }
    }

    if (!parsedReports) {
      return [];
    }

    // 🧹 サンプルデータが含まれている場合は自動的にサニタイズ（パージ）
    const sanitized = sanitizeReports(parsedReports);
    if (JSON.stringify(sanitized) !== JSON.stringify(parsedReports)) {
      localStorage.setItem(key, JSON.stringify(sanitized));
      localStorage.setItem(backupKey, JSON.stringify(sanitized));
      try {
        if (typeof window !== 'undefined' && window.location) {
          fetch(`/api/reports/${targetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitized)
          }).catch(() => {});
        }
      } catch {}
      console.log(`[Quiz Progress] サンプル学習履歴を自動パージ・保存しました: [${targetId}]`);
    } else {
      localStorage.setItem(backupKey, JSON.stringify(sanitized));
    }

    return sanitized;
  },

  // サーバーから最新の学習レポートを非同期取得・安全マージ（クロスデバイス同期対応・消失防止）
  async fetchReportsAsync(profileId?: string): Promise<DailyReport[]> {
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    const backupKey = `kids_learnquest_reports_backup_${targetId}`;
    const localReports = this.getReports(targetId);

    try {
      const reportsRes = await fetch(`/api/reports/${targetId}`);
      if (!reportsRes.ok) return localReports;
      const serverReports: DailyReport[] = await reportsRes.json();

      const allDates = Array.from(new Set([
        ...serverReports.map(r => r.date),
        ...localReports.map(r => r.date)
      ])).sort((a, b) => a.localeCompare(b));

      const mergedReports: DailyReport[] = allDates.map(date => {
        const sr = serverReports.find(r => r.date === date);
        const lr = localReports.find(r => r.date === date);

        if (sr && !lr) return sr;
        if (!sr && lr) return lr;

        // サーバーとローカル双方にデータがある場合はセッションを重複なく結合
        const sessionMap = new Map<string, QuizSession>();
        (sr?.sessions || []).forEach((sess, idx) => {
          const sKey = sess.id || `${sess.subject}-${sess.timestamp || ''}-${sess.unitName || ''}-${idx}`;
          sessionMap.set(sKey, sess);
        });
        (lr?.sessions || []).forEach((sess, idx) => {
          const sKey = sess.id || `${sess.subject}-${sess.timestamp || ''}-${sess.unitName || ''}-${idx}`;
          sessionMap.set(sKey, sess);
        });

        const combinedSessions = Array.from(sessionMap.values());

        if (combinedSessions.length > 0) {
          let calcAttempted = 0;
          let calcCorrect = 0;
          const subjectMinutes: Record<Subject, number> = { math: 0, japanese: 0, science: 0, social: 0, english: 0 };
          const subjectBreakdown: Partial<Record<Subject, { total: number; correct?: number }>> = {};

          combinedSessions.forEach(sess => {
             calcAttempted += (sess.questionsAttempted || 0);
             calcCorrect += (sess.questionsCorrect || 0);
             if (sess.subject) {
               subjectMinutes[sess.subject] = (subjectMinutes[sess.subject] || 0) + (sess.durationMinutes || 0);
               if (!subjectBreakdown[sess.subject]) {
                 subjectBreakdown[sess.subject] = { total: 0, correct: 0 };
               }
               subjectBreakdown[sess.subject]!.total += (sess.questionsAttempted || 0);
               subjectBreakdown[sess.subject]!.correct = (subjectBreakdown[sess.subject]!.correct || 0) + (sess.questionsCorrect || 0);
             }
          });

          // 🌟 問題数・正解数は既存ローカル/サーバー値と再集計値の最大値を採用（絶対データ減衰・消失防止）
          const questionsAttempted = Math.max(calcAttempted, lr?.questionsAttempted || 0, sr?.questionsAttempted || 0);
          const questionsCorrect = Math.max(calcCorrect, lr?.questionsCorrect || 0, sr?.questionsCorrect || 0);

          // 🌟 各科目の学習時間もローカル/サーバー/再集計値の最大値を採用（学習時間縮退・消失防止）
          (Object.keys(subjectMinutes) as Subject[]).forEach(sub => {
            subjectMinutes[sub] = Math.max(
              subjectMinutes[sub],
              lr?.subjectMinutes?.[sub] || 0,
              sr?.subjectMinutes?.[sub] || 0
            );
          });

          return {
            date,
            questionsAttempted,
            questionsCorrect,
            totalQuestions: questionsAttempted,
            subjectMinutes,
            subjectBreakdown,
            sessions: combinedSessions
          };
        }

        return (lr!.questionsAttempted >= sr!.questionsAttempted) ? lr! : sr!;
      });

      // 🧹 サンプルデータのパージ
      const cleanReports = sanitizeReports(mergedReports);

      const serialized = JSON.stringify(cleanReports);
      localStorage.setItem(key, serialized);
      localStorage.setItem(backupKey, serialized);

      // サーバー側へも最新のマージ済みレポートを逆同期
      fetch(`/api/reports/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: serialized
      }).catch(() => {});

      return cleanReports;
    } catch (err) {
      console.warn("レポートのサーバー非同期同期失敗:", err);
      return localReports;
    }
  },

  // 🧹 指定日付の学習レポートを手動削除（プロファイル単位・日々の記録から任意の日付を消去）
  deleteReportByDate(targetDate: string, profileId?: string): void {
    if (!targetDate) return;
    const targetId = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_reports_${targetId}`;
    const backupKey = `kids_learnquest_reports_backup_${targetId}`;

    const currentReports = this.getReports(targetId);
    const filteredReports = currentReports.filter(r => r.date !== targetDate);

    localStorage.setItem(key, JSON.stringify(filteredReports));
    localStorage.setItem(backupKey, JSON.stringify(filteredReports));

    // もし今日の日付を削除した場合、stats の lastActiveDate が今日であれば前回の学習日に戻す
    const todayStr = new Date().toISOString().split('T')[0];
    if (targetDate === todayStr) {
      const stats = this.getStats(targetId);
      if (stats.lastActiveDate === todayStr) {
        const remainingDates = filteredReports.map(r => r.date).sort();
        const prevDate = remainingDates.length > 0 ? remainingDates[remainingDates.length - 1] : null;
        stats.lastActiveDate = prevDate;
        this.saveStats(stats, targetId);
      }
    }

    try {
      if (typeof window !== 'undefined' && window.location) {
        fetch(`/api/reports/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filteredReports)
        }).catch(err => console.warn("指定日付レポート削除送信エラー:", err));
      }
    } catch (err) {
      console.warn("指定日付レポート削除例外:", err);
    }
    console.log(`[Quiz Progress] 指定日付の学習レポートを削除しました: [${targetId}] (${targetDate})`);
  },

  // 🧹 本日の学習レポートをリセット（プロファイル単位）
  resetTodayReport(profileId?: string): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.deleteReportByDate(todayStr, profileId);
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
    try {
      localStorage.setItem(`kids_learnquest_reports_backup_${targetId}`, JSON.stringify(reports));
    } catch (e) {
      console.warn("レポートバックアップ保存エラー:", e);
    }
    console.log(`[Quiz Progress] 解答記録完了: [${targetId}] ${subject} +${attempted}問 (+${durationMinutes.toFixed(2)}分) -> 本日累計: ${todayReport.questionsAttempted}問, ${todayReport.questionsCorrect}問正解, セッション数: ${todayReport.sessions.length}`);

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
  },

  // 📝 直近解いた問題テキストの取得（出題重複防止用）
  getRecentQuestionTexts(profileId?: string): string[] {
    const id = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_recent_questions_${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  // 📝 直近解いた問題テキストの保存（最大30件ローテーション）
  saveRecentQuestionTexts(texts: string[], profileId?: string): void {
    const id = profileId || storage.getActiveProfileId();
    const key = `kids_learnquest_recent_questions_${id}`;
    // 重複を整理し、最新30件を保持
    const unique = Array.from(new Set(texts)).slice(-30);
    localStorage.setItem(key, JSON.stringify(unique));
  },

  // 🔐 保護者認証セッションの取得 (リロード時のログアウト防止対応)
  isParentAuthenticated(): boolean {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const session = sessionStorage.getItem(PARENT_SESSION_KEY);
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.authenticated && parsed.expiresAt && Date.now() < parsed.expiresAt) {
            return true;
          }
        }
      }
    } catch {
      // ignore parsing error
    }
    return false;
  },

  // 🔐 保護者認証セッションの保存 / 破棄
  setParentAuthenticated(authenticated: boolean): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (authenticated) {
          sessionStorage.setItem(
            PARENT_SESSION_KEY,
            JSON.stringify({
              authenticated: true,
              expiresAt: Date.now() + 60 * 60 * 1000 // 1時間有効
            })
          );
        } else {
          sessionStorage.removeItem(PARENT_SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }
  }
};

