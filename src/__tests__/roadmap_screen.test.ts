import { describe, it, expect } from 'vitest';
import { calculateUnitStatus } from '../components/RoadmapScreen';

describe('RoadmapScreen status logic', () => {
  it('should return mastered if unitCode is in completedUnits', () => {
    const completedUnits = ['cos-m3-01', 'cos-m3-02'];
    expect(calculateUnitStatus('cos-m3-01', completedUnits)).toBe('mastered');
  });

  it('should return locked or default if unitCode is not in completedUnits', () => {
    const completedUnits = ['cos-m3-01'];
    expect(calculateUnitStatus('cos-m3-02', completedUnits)).toBe('locked');
  });
});
