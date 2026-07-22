import { describe, it, expect, beforeEach } from 'vitest';
import { getLocalCompletedUnits, markUnitCompleted } from '../data/progress';

describe('Quiz completion and unit progress integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should mark activeUnit as completed when quiz finishes with activeUnit code', () => {
    const profileId = 'profile-1';
    const unitCode = 'cos-m9-01';

    // まだ完了していない状態
    expect(getLocalCompletedUnits(profileId)).not.toContain(unitCode);

    // クイズ完了処理と同等の呼び出し
    markUnitCompleted(profileId, unitCode);

    // 完了リストに含まれること
    expect(getLocalCompletedUnits(profileId)).toContain(unitCode);
  });
});
