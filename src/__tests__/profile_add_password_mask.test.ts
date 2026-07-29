import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';

vi.mock('../utils/sound', () => ({
  sound: {
    playClick: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
    playLevelUp: vi.fn()
  }
}));

vi.mock('../utils/haptics', () => ({
  haptics: {
    vibrateClick: vi.fn(),
    vibrateCorrect: vi.fn(),
    vibrateWrong: vi.fn(),
    vibrateLevelUp: vi.fn()
  }
}));

describe('ProfileSelectorModal Add Profile Password Masking', () => {

  it('should render masked password input field when adding a new profile', async () => {
    const onSelectProfile = vi.fn();
    const onClose = vi.fn();

    render(
      React.createElement(ProfileSelectorModal, {
        onSelectProfile,
        onClose
      })
    );

    // 「＋ あたらしい家族・プレイヤーを追加する」ボタンをクリック
    const addBtn = screen.getByText(/あたらしい家族・プレイヤーを追加する/);
    fireEvent.click(addBtn);

    // 🔑 保護者確認 モーダルが表示される
    expect(screen.getByText(/保護者確認/)).toBeTruthy();

    // 入力フィールドが type="password" であること
    const passwordInput = screen.getByPlaceholderText(/パスワードを入力/) as HTMLInputElement;
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.type).toBe('password');

    // 不正なパスワードを入力して送信
    fireEvent.change(passwordInput, { target: { value: 'invalid_pass_999' } });
    const submitBtn = screen.getByText('認証して進む');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/保護者パスワードが正しくありません/)).toBeTruthy();
    });
  });
});
