import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultModal } from '../components/ResultModal';
import type { QuestionSRSItem, UserStats } from '../types';

describe('ResultModal SRS（記憶定着ステップ）UI表示テスト', () => {
  beforeEach(() => {
    // jsdom 用に canvas context をモック
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn()
    });
  });
  const dummyStats: UserStats = {
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    coins: 50,
    streak: 1,
    lastActiveDate: '2026-09-09',
    unlockedBadges: [],
    equippedAvatar: { base: 'base-boy', hat: 'hat-none', accessory: 'acc-none', companion: 'comp-none' },
    ownedItems: []
  };

  it('srsUpdatesが渡された際、各ステージに応じたバッジと文言が正しくレンダリングされること', () => {
    const srsUpdates: QuestionSRSItem[] = [
      {
        questionKey: 'q1',
        questionId: 'q1',
        subject: 'math',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-09',
        nextAvailableAt: '2026-09-16',
        intervalDays: 7,
        isMastered: false,
        correctStreak: 1,
        totalAttempts: 1,
        totalCorrect: 1
      },
      {
        questionKey: 'q2',
        questionId: 'q2',
        subject: 'math',
        grade: 3,
        stage: 2,
        lastAttemptedAt: '2026-09-09',
        nextAvailableAt: '2026-10-07',
        intervalDays: 28,
        isMastered: false,
        correctStreak: 2,
        totalAttempts: 2,
        totalCorrect: 2
      },
      {
        questionKey: 'q3',
        questionId: 'q3',
        subject: 'math',
        grade: 3,
        stage: 4,
        lastAttemptedAt: '2026-09-09',
        nextAvailableAt: '9999-12-31',
        intervalDays: 9999,
        isMastered: true,
        correctStreak: 4,
        totalAttempts: 4,
        totalCorrect: 4
      },
      {
        questionKey: 'q4',
        questionId: 'q4',
        subject: 'math',
        grade: 3,
        stage: 1,
        lastAttemptedAt: '2026-09-09',
        nextAvailableAt: '2026-09-10',
        intervalDays: 1,
        isMastered: false,
        correctStreak: 0,
        totalAttempts: 2,
        totalCorrect: 1
      }
    ];

    render(
      <ResultModal
        correctCount={3}
        totalCount={4}
        stats={dummyStats}
        srsUpdates={srsUpdates}
        onUpdateStats={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // タイトルが表示されていること
    expect(screen.getByText(/記憶の定着ステップ（忘却曲線システム）/i)).toBeDefined();

    // 各ステージのバッジ文言が表示されていること
    expect(screen.getByText(/1回目クリア（次は1週間後に復習）/i)).toBeDefined();
    expect(screen.getByText(/2回目クリア（次は4週間後に復習）/i)).toBeDefined();
    expect(screen.getByText(/完全マスター達成！（ノルマ卒業）/i)).toBeDefined();
    expect(screen.getByText(/明日もう一度復習！/i)).toBeDefined();
  });
});
