import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../utils/storage';

describe('Parent Master Password Storage & Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default parent password "parent" if not customized', () => {
    expect(storage.getParentPassword()).toBe('parent');
  });

  it('should update and verify customized parent password correctly', () => {
    storage.setParentPassword('secret123');
    expect(storage.getParentPassword()).toBe('secret123');
    expect(storage.verifyParentPassword('secret123')).toBe(true);
    expect(storage.verifyParentPassword('wrongpass')).toBe(false);
  });
});
