import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoadmapScreen } from '../components/RoadmapScreen';
import type { UserProfile } from '../types';

describe('RoadmapScreen 2学期制対応と表示比較切り替えテスト', () => {
  const profile2Term: UserProfile = {
    id: 'user-2term',
    name: '2期生',
    avatarEmoji: '👦',
    grade: 1,
    semesterSystem: '2-term',
    stats: {
      level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
      lastActiveDate: null, unlockedBadges: [],
      equippedAvatar: { base: '👦', hat: '', accessory: '', companion: '' },
      ownedItems: []
    }
  };

  it('2学期制のプロフィールでは初期状態で「前期」「後期」バッジが表示される', async () => {
    await React.act(async () => {
      render(
        <RoadmapScreen
          profile={profile2Term}
          onSelectUnitQuiz={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    // 小1算数の1単元目（かずと たしざん）は前期
    expect(screen.getAllByText('前期').length).toBeGreaterThan(0);
    // 5単元目（くりさがりの ある ひきざん）は後期
    expect(screen.getAllByText('後期').length).toBeGreaterThan(0);
  });

  it('「3学期制」トグルボタンを押すと表示が「1学期」「2学期」「3学期」に切り替わる', async () => {
    await React.act(async () => {
      render(
        <RoadmapScreen
          profile={profile2Term}
          onSelectUnitQuiz={vi.fn()}
          onClose={vi.fn()}
        />
      );
    });

    // 3学期制ボタンを押下
    const triTermBtn = screen.getByRole('button', { name: /3学期制/i });
    fireEvent.click(triTermBtn);

    // バッジが「1学期」「2学期」「3学期」に切り替わる
    expect(screen.getAllByText('1学期').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3学期').length).toBeGreaterThan(0);

    // 再度「2学期制」ボタンを押下
    const biTermBtn = screen.getByRole('button', { name: /2学期制/i });
    fireEvent.click(biTermBtn);

    expect(screen.getAllByText('前期').length).toBeGreaterThan(0);
  });
});
