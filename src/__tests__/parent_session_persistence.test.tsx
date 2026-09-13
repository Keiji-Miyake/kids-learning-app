import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParentDashboard } from '../components/ParentDashboard';
import { App } from '../App';
import { storage } from '../utils/storage';

describe('保護者管理画面 セッション維持・リロード対応テスト (Parent Session Persistence Test)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    storage.setParentPassword('parent');
    storage.setParentAuthenticated(false);
  });

  it('保護者認証後、storage.isParentAuthenticated() が true を返し、sessionStorage に記録されること', async () => {
    expect(storage.isParentAuthenticated()).toBe(false);

    render(<ParentDashboard onClose={() => {}} />);
    const passInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(passInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByRole('button', { name: /ログインして進む/ }));

    // 認証完了
    expect(await screen.findByText(/保護者向け学習レポート ＆ 管理エリア/)).toBeTruthy();
    expect(storage.isParentAuthenticated()).toBe(true);
  });

  it('すでに認証セッションが存在する場合、リロード(再マウント)時にパスワード入力をスキップして直接ダッシュボードが開くこと', () => {
    // 認証セッションをセット（リロード直前の状態をシミュレート）
    storage.setParentAuthenticated(true);
    expect(storage.isParentAuthenticated()).toBe(true);

    // 再マウント (リロード)
    render(<ParentDashboard onClose={() => {}} />);

    // パスワード入力画面ではなく、直接管理ダッシュボードが表示される
    expect(screen.queryByPlaceholderText('保護者パスワード')).toBeNull();
    expect(screen.getByText(/保護者向け学習レポート ＆ 管理エリア/)).toBeTruthy();
  });

  it('「ログアウト」ボタンをクリックすると認証セッションが破棄され、未認証状態に戻ること', async () => {
    storage.setParentAuthenticated(true);
    render(<ParentDashboard onClose={() => {}} />);

    const logoutBtn = screen.getByRole('button', { name: /ログアウト/ });
    fireEvent.click(logoutBtn);

    expect(storage.isParentAuthenticated()).toBe(false);
    expect(screen.getByPlaceholderText('保護者パスワード')).toBeTruthy();
  });

  it('URLハッシュまたはsessionStorageにdashboardが記録されている場合、Appリロード時に直接保護者管理画面が開くこと', () => {
    sessionStorage.setItem('kids_learnquest_current_screen', 'dashboard');
    storage.setParentAuthenticated(true);

    render(<App />);

    // プロファイル選択モーダルは表示されず、保護者管理エリアが直接表示されること
    expect(screen.getByText(/保護者向け学習レポート ＆ 管理エリア/)).toBeTruthy();
  });
});
