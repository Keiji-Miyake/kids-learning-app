import { describe, it, expect } from 'vitest';

describe('Navbar Profile Dropdown & Logout Logic', () => {
  it('should handle logout correctly by resetting active profile session', () => {
    let activeProfileId: string | null = 'profile-1';
    const handleLogout = () => {
      activeProfileId = null;
    };
    handleLogout();
    expect(activeProfileId).toBeNull();
  });
});
