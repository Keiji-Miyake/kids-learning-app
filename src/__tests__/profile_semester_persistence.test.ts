import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';
import type { UserProfile } from '../types';

describe('UserProfile semesterSystem 永続化テスト', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('新規プロフィール作成時に semesterSystem を保存・取得できる', () => {
    const profile = storage.addProfile('次郎', '👦', 4, undefined, undefined, '2-term');
    expect(profile.semesterSystem).toBe('2-term');

    const loaded = storage.getProfile(profile.id);
    expect(loaded?.semesterSystem).toBe('2-term');
  });

  it('既存プロフィールの semesterSystem を updateProfile で更新できる', () => {
    const profile = storage.addProfile('花子', '👧', 2);
    expect(profile.semesterSystem).toBeUndefined(); // または '3-term'

    const updated: UserProfile = {
      ...profile,
      semesterSystem: '2-term'
    };
    storage.updateProfile(updated);

    const reloaded = storage.getProfile(profile.id);
    expect(reloaded?.semesterSystem).toBe('2-term');
  });

  it('semesterSystem が未設定の古いプロフィールでも安全に読み込まれる（後方互換）', () => {
    const legacyProfile: UserProfile = {
      id: 'legacy-1',
      name: '太郎',
      avatarEmoji: '👦',
      grade: 3,
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
        lastActiveDate: null, unlockedBadges: [],
        equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    };
    storage.saveProfiles([legacyProfile]);
    const profiles = storage.getProfiles();
    expect(profiles[0].id).toBe('legacy-1');
    expect(profiles[0].semesterSystem).toBeUndefined();
  });
});
