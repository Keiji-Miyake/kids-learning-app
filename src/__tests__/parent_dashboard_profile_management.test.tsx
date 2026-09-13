import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ParentDashboard } from '../components/ParentDashboard';
import { storage } from '../utils/storage';

describe('管理画面でのプロフィール一元管理テスト (Parent Dashboard Profile Management)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storage.setParentPassword('1234');
  });

  it('管理画面内で「プロフィール管理」タブを開き、別ユーザーのプロフィール編集フォームが開いて保存できること', async () => {
    render(<ParentDashboard onClose={() => {}} />);

    // 1. まず保護者認証を通過
    const pwdInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(pwdInput, { target: { value: '1234' } });
    const loginBtn = screen.getByRole('button', { name: /ログインして進む/ });
    fireEvent.click(loginBtn);

    // 2. 「プロフィール管理」タブが表示されるのを待ってクリック
    const profileTab = await screen.findByRole('button', { name: /👥 プロフィール管理/ });
    expect(profileTab).toBeDefined();
    fireEvent.click(profileTab);

    // 3. 全プロファイル（たろう、はなこ、じろう）が表示されていること
    expect(screen.getByText('たろう')).toBeDefined();
    expect(screen.getByText('はなこ')).toBeDefined();

    // 4. 「はなこ」の編集ボタンをクリック
    const editButtons = screen.getAllByRole('button', { name: /編集 ✏️/ });
    expect(editButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(editButtons[1]); // 2人目（はなこ）の編集

    // 5. 名前を変更して保存
    const nameInput = screen.getByLabelText(/おなまえ/);
    fireEvent.change(nameInput, { target: { value: 'はなこ_改' } });
    const saveBtn = screen.getByRole('button', { name: /保存する/ });
    fireEvent.click(saveBtn);

    // 6. storage に反映されていること
    const updatedProfiles = storage.getProfiles();
    const updatedHanako = updatedProfiles.find(p => p.id === 'profile-2');
    expect(updatedHanako?.name).toBe('はなこ_改');
  });

  it('管理画面から新しいお子様プロフィールを追加できること', async () => {
    render(<ParentDashboard onClose={() => {}} />);

    const pwdInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(pwdInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /ログインして進む/ }));

    const profileTab = await screen.findByRole('button', { name: /👥 プロフィール管理/ });
    fireEvent.click(profileTab);

    // 追加ボタンをクリック
    const addBtn = screen.getByRole('button', { name: /＋ 新しいプレイヤーを追加/ });
    fireEvent.click(addBtn);

    // フォームに入力して保存
    const nameInput = screen.getByLabelText(/おなまえ/);
    fireEvent.change(nameInput, { target: { value: 'ゆうき' } });
    fireEvent.click(screen.getByRole('button', { name: /保存する/ }));

    // 追加されていること
    const profiles = storage.getProfiles();
    expect(profiles.some(p => p.name === 'ゆうき')).toBe(true);
  });
});
