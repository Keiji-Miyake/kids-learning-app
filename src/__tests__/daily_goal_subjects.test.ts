import { describe, it, expect, beforeEach } from 'vitest';
import type { UserProfile, DailyGoal } from '../types';
import { storage } from '../utils/storage';

describe('ノルマの細分化設定テスト (Daily Goal Subject & Unit Customization)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('全体目標に加え、対象教科・対象単元、教科別個別目標をProfileに設定・保存できること', () => {
    const profile = storage.getActiveProfile();
    const updatedGoal: DailyGoal = {
      targetQuestions: 10,
      targetMinutes: 20,
      rewardText: '🎁 おやつダブル！',
      targetSubject: 'math',
      targetUnitName: '一次関数',
      subjectGoals: {
        math: { targetQuestions: 5, targetMinutes: 10 },
        english: { targetQuestions: 3, targetMinutes: 5 }
      }
    };

    const updatedProfile: UserProfile = {
      ...profile,
      dailyGoal: updatedGoal
    };

    storage.updateProfile(updatedProfile);

    const reloaded = storage.getProfiles().find(p => p.id === profile.id);
    expect(reloaded).toBeDefined();
    expect(reloaded?.dailyGoal?.targetQuestions).toBe(10);
    expect(reloaded?.dailyGoal?.targetSubject).toBe('math');
    expect(reloaded?.dailyGoal?.targetUnitName).toBe('一次関数');
    expect(reloaded?.dailyGoal?.subjectGoals?.math?.targetQuestions).toBe(5);
    expect(reloaded?.dailyGoal?.subjectGoals?.english?.targetMinutes).toBe(5);
  });
});
