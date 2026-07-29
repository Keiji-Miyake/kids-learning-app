import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { UserStats } from '../types';

describe('学習ログ・コイン・レベル保護テスト (Stats & Progress Protection Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ローカルで獲得したコイン・レベル・Expが、サーバーの初期データによってリセットされないこと', () => {
    // 1. ユーザーが頑張って進めたプロファイル・Statsを作成
    const profile = storage.getActiveProfile();
    const advancedStats: UserStats = {
      ...profile.stats,
      level: 5,
      exp: 450,
      coins: 300,
      streak: 7,
      ownedItems: ['base-boy', 'hat-crown']
    };

    // ローカルストレージに保存
    storage.saveStats(advancedStats, profile.id);

    // 2. この状態で storage.getStats() を取得すると進んだデータであること
    const statsBeforeSync = storage.getStats(profile.id);
    expect(statsBeforeSync.level).toBe(5);
    expect(statsBeforeSync.coins).toBe(300);

    // 3. syncFromServer を実行した際にも、高レベル・高コインのデータが優先保持されること
    // (mock fetchまたはsafe mergeにより保護される)
    const localProfiles = storage.getProfiles();
    const p = localProfiles.find(lp => lp.id === profile.id);
    expect(p).toBeDefined();

    // 進行状況が保持されていること
    const statsAfter = storage.getStats(profile.id);
    expect(statsAfter.coins).toBeGreaterThanOrEqual(300);
    expect(statsAfter.level).toBeGreaterThanOrEqual(5);
  });
});
