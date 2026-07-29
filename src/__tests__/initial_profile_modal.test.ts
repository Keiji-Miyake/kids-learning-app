import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';

describe('起動時プロフィール選択モーダル表示テスト (Initial Profile Modal Test)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('デフォルトで複数プロフィールが存在し、初期状態でもアクティブプロフィールが取得できること', () => {
    const profiles = storage.getProfiles();
    expect(profiles.length).toBeGreaterThan(0);
    const activeId = storage.getActiveProfileId();
    expect(activeId).toBe(profiles[0].id);
  });
});
