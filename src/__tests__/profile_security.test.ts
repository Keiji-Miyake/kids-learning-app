import { describe, it, expect } from 'vitest';
import { canDeleteProfile, canEditProfile, canAddProfile } from '../components/ProfileSelectorModal';




describe('Profile Security & Deletion Guard', () => {
  it('should allow deleting active self profile if multiple profiles exist', () => {
    const activeId = 'profile-1';
    const targetId = 'profile-1';
    const totalCount = 3;
    expect(canDeleteProfile(activeId, targetId, totalCount)).toBe(true);
  });

  it('should NOT allow deleting another user profile (non-active id)', () => {
    const activeId = 'profile-1';
    const targetId = 'profile-2'; // 他人のプロファイル
    const totalCount = 3;
    expect(canDeleteProfile(activeId, targetId, totalCount)).toBe(false);
  });

  it('should NOT allow deleting if only 1 profile exists', () => {
    const activeId = 'profile-1';
    const targetId = 'profile-1';
    const totalCount = 1;
    expect(canDeleteProfile(activeId, targetId, totalCount)).toBe(false);
  });

  it('canEditProfile should allow editing self active profile, but disallow editing other profiles', () => {
    expect(canEditProfile('profile-1', 'profile-1')).toBe(true);
    expect(canEditProfile('profile-1', 'profile-2')).toBe(false);
  });

  it('canAddProfile should require valid parent password', () => {
    expect(canAddProfile('parent')).toBe(true);
    expect(canAddProfile('wrongpass')).toBe(false);
  });

});


