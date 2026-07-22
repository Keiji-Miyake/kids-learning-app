import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchCompletedUnits, markUnitCompleted, getLocalCompletedUnits } from '../data/progress';

describe('Progress Data Layer (src/data/progress.ts)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should save completed unit locally and get it via getLocalCompletedUnits', () => {
    markUnitCompleted('profile-1', 'cos-m3-01');
    const units = getLocalCompletedUnits('profile-1');
    expect(units).toContain('cos-m3-01');
  });

  it('should not duplicate unit codes in local storage', () => {
    markUnitCompleted('profile-1', 'cos-m3-01');
    markUnitCompleted('profile-1', 'cos-m3-01');
    const units = getLocalCompletedUnits('profile-1');
    expect(units.filter(u => u === 'cos-m3-01').length).toBe(1);
  });

  it('should fetch completed units from server and cache locally', async () => {
    const fakeUnits = ['cos-m3-01', 'cos-m3-02'];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ profileId: 'profile-1', completedUnits: fakeUnits })
    } as Response);

    const units = await fetchCompletedUnits('profile-1');
    expect(units).toEqual(fakeUnits);
    expect(getLocalCompletedUnits('profile-1')).toEqual(fakeUnits);
  });
});
