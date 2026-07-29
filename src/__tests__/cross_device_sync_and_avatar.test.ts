import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { UserStats } from '../types';

describe('端末間同期およびアバターアイコン連動テスト (Cross Device Sync & Avatar Integration Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('アバターの着せ替え(equippedAvatar)がプロファイルのstatsに反映され保存できること', () => {
    const profile = storage.getActiveProfile();
    const newStats: UserStats = {
      ...profile.stats,
      equippedAvatar: {
        base: 'base-boy',
        hat: 'hat-crown',
        accessory: 'acc-glasses',
        companion: 'comp-cat'
      }
    };

    storage.saveStats(newStats, profile.id);

    const updatedProfile = storage.getActiveProfile();
    expect(updatedProfile.stats.equippedAvatar.hat).toBe('hat-crown');
    expect(updatedProfile.stats.equippedAvatar.accessory).toBe('acc-glasses');
  });
});
