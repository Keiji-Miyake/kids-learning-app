import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';
import { storage } from '../utils/storage';

describe('ProfileSelectorModal 生年月日・学年編集の保護者セキュリティテスト', () => {
  const mockProfiles = [
    {
      id: 'profile-child',
      name: 'たろう',
      avatarEmoji: '👦',
      grade: 3,
      birthDate: '2017-05-10',
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 1, lastActiveDate: null,
        unlockedBadges: [], equippedAvatar: { base: 'default', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    }
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('kids_learnquest_profiles_list', JSON.stringify(mockProfiles));
    localStorage.setItem('kids_learnquest_active_profile_id', 'profile-child');
  });

  it('通常のお子様編集モードでは、学年と生年月日の入力欄が無効化（disabled）されていること', async () => {
    render(<ProfileSelectorModal onSelectProfile={vi.fn()} onClose={vi.fn()} />);

    // 編集ボタンをクリック
    const editBtn = screen.getByText('へんしゅう ✏️');
    fireEvent.click(editBtn);

    // 生年月日および学年セレクトボックスが disabled であること
    const gradeSelect = screen.getByLabelText(/学年/i) as HTMLSelectElement;
    expect(gradeSelect.disabled).toBe(true);

    const birthDateInput = screen.getByLabelText(/生年月日/i) as HTMLInputElement;
    expect(birthDateInput.disabled).toBe(true);

    // 保護者認証の案内が表示されていること
    expect(screen.getByText(/学年や生年月日の変更は保護者パスワードが必要です/i)).toBeDefined();
  });

  it('保護者パスワード認証を解除すると、学年と生年月日の編集が可能になること', async () => {
    vi.spyOn(storage, 'verifyParentPasswordAsync').mockResolvedValue(true);
    render(<ProfileSelectorModal onSelectProfile={vi.fn()} onClose={vi.fn()} />);

    // 編集画面を開く
    fireEvent.click(screen.getByText('へんしゅう ✏️'));

    // 「保護者ロックを解除して変更」ボタンをクリック
    const unlockBtn = screen.getByText(/保護者ロックを解除して変更/i);
    fireEvent.click(unlockBtn);

    // パスワード入力
    const passwordInput = screen.getByPlaceholderText(/保護者パスワード/i);
    fireEvent.change(passwordInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/解除する/i));

    await waitFor(() => {
      const birthInput = screen.getByLabelText(/生年月日/i) as HTMLInputElement;
      const gradeInput = screen.getByLabelText(/学年/i) as HTMLSelectElement;
      expect(birthInput.disabled).toBe(false);
      expect(gradeInput.disabled).toBe(false);
    });
  });
});
