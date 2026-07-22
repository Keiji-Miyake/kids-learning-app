import { describe, it, expect } from 'vitest';
import { verifyParentPin } from '../components/ParentDashboard';

describe('Parent Quota & Goal Authorization Guard', () => {
  it('verifyParentPin should validate PIN correctly', () => {
    expect(verifyParentPin('1234', '1234')).toBe(true);
    expect(verifyParentPin('1234', '0000')).toBe(false);
    expect(verifyParentPin(undefined, '1234')).toBe(true);
  });
});
