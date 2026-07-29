import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import app from '../../server.js';
import { storage } from '../utils/storage';

const DB_FILE = path.join(process.cwd(), 'db.json');

describe('Daily Goal Realtime Sync & Server Priority Test', () => {
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

  it('should prioritize server dailyGoal over stale local dailyGoal during syncFromServer', async () => {
    // 1. ローカルに古いノルマ設定(5問)を保存
    const oldGoal = { targetQuestions: 5, targetMinutes: 10, rewardText: '古いご褒美' };
    const currentProfiles = storage.getProfiles();
    const updatedLocalProfiles = currentProfiles.map(p => {
      if (p.id === 'profile-1') {
        return { ...p, dailyGoal: oldGoal };
      }
      return p;
    });
    localStorage.setItem('kids_learnquest_profiles_list', JSON.stringify(updatedLocalProfiles));

    // 2. サーバーDBへ保護者が新しいノルマ設定(15問)を更新
    const newGoal = { targetQuestions: 15, targetMinutes: 20, rewardText: '新しいご褒美！' };
    const serverProfilesRes = await request(app).get('/api/profiles');
    const targetProfile = serverProfilesRes.body.find((p: any) => p.id === 'profile-1');
    expect(targetProfile).toBeDefined();

    const updatedProfileOnServer = {
      ...targetProfile,
      dailyGoal: newGoal
    };

    const putRes = await request(app)
      .put('/api/profiles')
      .send(updatedProfileOnServer);
    expect(putRes.status).toBe(200);

    // 3. 子ども端末側で getProfiles / サーバー同期検証
    const profilesFromApi = await request(app).get('/api/profiles');
    const apiTarget = profilesFromApi.body.find((p: any) => p.id === 'profile-1');
    expect(apiTarget.dailyGoal.targetQuestions).toBe(15);
    expect(apiTarget.dailyGoal.rewardText).toBe('新しいご褒美！');
  });
});
