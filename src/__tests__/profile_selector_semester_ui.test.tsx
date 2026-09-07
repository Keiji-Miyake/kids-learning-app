import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';
import { storage } from '../utils/storage';
import type { UserProfile } from '../types';

describe('ProfileSelectorModal 学期制設定UIテスト', () => {
  beforeEach(() => {
    localStorage.clear();
    const testProfile: UserProfile = {
      id: 'test-child-1',
      name: 'テスト生徒',
      avatarEmoji: '👦',
      grade: 3,
      semesterSystem: '3-term',
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
        lastActiveDate: null, unlockedBadges: [],
        equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    };
    storage.saveProfiles([testProfile]);
    storage.setActiveProfileId('test-child-1');
  });

  it('プロフィール編集モードで学期制の選択肢（3学期制 / 2学期制）が表示され、変更して保存できる', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ProfileSelectorModal onSelectProfile={onSelect} onClose={onClose} />);

    // 編集ボタンをクリック
    const editBtn = screen.getByText('へんしゅう ✏️');
    fireEvent.click(editBtn);

    // 学期制のラベルとセレクトが存在することを確認
    const semesterSelect = screen.getByLabelText('学期制：') as HTMLSelectElement;
    expect(semesterSelect).toBeDefined();
    expect(semesterSelect.value).toBe('3-term');

    // 2学期制に変更
    fireEvent.change(semesterSelect, { target: { value: '2-term' } });
    expect(semesterSelect.value).toBe('2-term');

    // 保存ボタンをクリック
    const saveBtn = screen.getByText('ほぞんする ✨');
    fireEvent.click(saveBtn);

    // ストレージに semesterSystem: '2-term' が保存されていることを検証
    const saved = storage.getProfile('test-child-1');
    expect(saved?.semesterSystem).toBe('2-term');
  });

  it('新規プロフィール作成時にも学期制（2学期制）を選択して保存できる', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ProfileSelectorModal onSelectProfile={onSelect} onClose={onClose} />);

    // 追加ボタンをクリック
    const addBtn = screen.getByText(/あたらしい家族・プレイヤーを追加する/);
    fireEvent.click(addBtn);

    // 保護者パスワードを入力
    const pwInput = screen.getByPlaceholderText(/パスワードを入力/);
    fireEvent.change(pwInput, { target: { value: 'parent' } });
    const authSubmit = screen.getByText('認証して進む');
    fireEvent.click(authSubmit);

    // 追加フォームが表示されるのを待機
    await waitFor(() => {
      expect(screen.getByText('➕ 新しいプレイヤーの追加')).toBeTruthy();
    });

    // おなまえ入力
    const nameInput = screen.getByPlaceholderText(/例: たろう/);
    fireEvent.change(nameInput, { target: { value: 'あたらしいたろう' } });

    // 学期制セレクトが存在することを確認
    const semesterSelect = screen.getByLabelText('学期制：') as HTMLSelectElement;
    expect(semesterSelect).toBeDefined();
    expect(semesterSelect.value).toBe('3-term');

    // 2学期制に変更
    fireEvent.change(semesterSelect, { target: { value: '2-term' } });
    expect(semesterSelect.value).toBe('2-term');

    // 追加してスタートをクリック
    const submitBtn = screen.getByText('追加してスタート！');
    fireEvent.click(submitBtn);

    // 作成されたプロフィールの学期制が 2-term になっていること
    const profiles = storage.getProfiles();
    const created = profiles.find(p => p.name === 'あたらしいたろう');
    expect(created).toBeDefined();
    expect(created?.semesterSystem).toBe('2-term');
  });

  it('学期制未設定の既存プロフィールを編集する場合、3-termがデフォルト値となる', () => {
    const legacyProfile: UserProfile = {
      id: 'test-legacy-1',
      name: 'レガシー生徒',
      avatarEmoji: '👧',
      grade: 2,
      stats: {
        level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
        lastActiveDate: null, unlockedBadges: [],
        equippedAvatar: { base: '👧', hat: '', accessory: '', companion: '' },
        ownedItems: []
      }
    };
    storage.saveProfiles([legacyProfile]);
    storage.setActiveProfileId('test-legacy-1');

    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ProfileSelectorModal onSelectProfile={onSelect} onClose={onClose} />);

    const editBtn = screen.getByText('へんしゅう ✏️');
    fireEvent.click(editBtn);

    const semesterSelect = screen.getByLabelText('学期制：') as HTMLSelectElement;
    expect(semesterSelect.value).toBe('3-term');
  });
});
