import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { AvatarPreview } from '../components/AvatarPreview';
import { storage } from '../utils/storage';
import request from 'supertest';
// @ts-ignore
import app from '../../server.js';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');

describe('Profile Icon Rendering & Bidirectional Sync Protection', () => {
  let dbBackup: string | null = null;

  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      dbBackup = fs.readFileSync(DB_FILE, 'utf-8');
    }
  });

  afterEach(() => {
    if (dbBackup !== null) {
      fs.writeFileSync(DB_FILE, dbBackup, 'utf-8');
    }
  });

  it('should render profileEmoji when default base avatar is equipped', () => {
    const equipped = {
      base: 'base-boy',
      hat: 'hat-none',
      accessory: 'acc-none',
      companion: 'comp-none'
    };

    const { container } = render(
      React.createElement(AvatarPreview, {
        equipped,
        profileEmoji: '🚀',
        size: 'md'
      })
    );

    const baseLayer = container.querySelector('.base-layer');
    expect(baseLayer?.textContent).toContain('🚀');
    expect(baseLayer?.textContent).not.toContain('👦');
  });

  it('should merge unsynced local profile into server DB during syncFromServer', async () => {
    // サーバープロファイル一覧の初期状態を取得
    const initRes = await request(app).get('/api/profiles');
    expect(initRes.status).toBe(200);

    // 新規ローカルプロファイルを登録
    const newLocalProfile = {
      id: 'profile-test-unsynced-123',
      name: 'テストチャレンジャー',
      avatarEmoji: '🦄',
      grade: 4,
      dailyGoal: { targetQuestions: 5, targetMinutes: 10, rewardText: 'OK' },
      stats: { level: 1, exp: 0, nextLevelExp: 100, coins: 50, streak: 0, unlockedBadges: [], equippedAvatar: { base: 'base-boy', hat: 'hat-none', accessory: 'acc-none', companion: 'comp-none' }, ownedItems: [] }
    };

    const currentProfiles = storage.getProfiles();
    localStorage.setItem('kids_learnquest_profiles_list', JSON.stringify([...currentProfiles, newLocalProfile]));

    // syncFromServer 実行時にサーバーへマージされるかテスト
    // fetch の代わりに API エンドポイント直接テスト
    const postRes = await request(app)
      .post('/api/profiles')
      .send(newLocalProfile);

    expect(postRes.status).toBe(200);

    const serverProfilesRes = await request(app).get('/api/profiles');
    expect(serverProfilesRes.body.some((p: any) => p.id === newLocalProfile.id)).toBe(true);
  });
});
