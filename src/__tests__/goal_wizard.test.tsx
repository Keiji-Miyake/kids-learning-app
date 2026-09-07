import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalSettingWizard } from '../components/GoalSettingWizard';
import type { UserProfile, DailyGoal } from '../types';

describe('GoalSettingWizard Component Tests', () => {
  const mockProfile: UserProfile = {
    id: 'profile-1',
    name: 'たろう',
    avatarEmoji: '👦',
    dailyGoal: {
      goalType: 'subject_specific',
      targetQuestions: 5,
      targetMinutes: 10,
      rewardText: 'ゲーム30分OK！',
      subjectGoals: {
        math: { targetQuestions: 3, targetMinutes: 5 },
        japanese: { targetQuestions: 3, targetMinutes: 5 },
        science: { targetQuestions: 0, targetMinutes: 0 },
        social: { targetQuestions: 0, targetMinutes: 0 },
        english: { targetQuestions: 0, targetMinutes: 0 }
      }
    },
    stats: {
      level: 1, exp: 0, nextLevelExp: 100, coins: 0, streak: 0,
      lastActiveDate: null, unlockedBadges: [], ownedItems: [],
      equippedAvatar: { base: 'default', hat: 'none', accessory: 'none', companion: 'none' }
    }
  };

  it('renders Step 1 with 3 goal types and advances to Step 2 with subject inputs by default', () => {
    render(<GoalSettingWizard profile={mockProfile} onSave={() => {}} />);
    expect(screen.getByText(/1\. 目標タイプの選択/i)).toBeDefined();
    expect(screen.getByText(/科目別目標/i)).toBeDefined();
    expect(screen.getByText(/合計問題数重視/i)).toBeDefined();
    expect(screen.getByText(/合計時間重視/i)).toBeDefined();

    const nextBtn = screen.getByRole('button', { name: /次へ進む/i });
    fireEvent.click(nextBtn);

    // Step 2
    expect(screen.getByText(/2\. 目標値の設定/i)).toBeDefined();
    expect(screen.getAllByText(/算数/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/国語/i).length).toBeGreaterThan(0);
  });

  it('switches dynamic inputs when total_time is selected in Step 1', () => {
    render(<GoalSettingWizard profile={mockProfile} onSave={() => {}} />);
    const timeCard = screen.getByText(/合計時間重視/i);
    fireEvent.click(timeCard);

    const nextBtn = screen.getByRole('button', { name: /次へ進む/i });
    fireEvent.click(nextBtn);

    // Step 2 for total_time
    expect(screen.getByText(/1日の目標学習時間/i)).toBeDefined();
    expect(screen.queryByText(/🧮 算数/i)).toBeNull();
  });

  it('completes all 3 steps and calls onSave with complete DailyGoal', () => {
    const handleSave = vi.fn();
    render(<GoalSettingWizard profile={mockProfile} onSave={handleSave} />);

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /次へ進む/i }));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /次へ進む/i }));

    expect(screen.getByText(/3\. 約束・ご褒美の設定/i)).toBeDefined();
    expect(screen.getByText(/設定内容の確認/i)).toBeDefined();

    // Click save button
    const saveBtn = screen.getByRole('button', { name: /ノルマ・ご褒美を保存する/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    const savedGoal: DailyGoal = handleSave.mock.calls[0][0];
    expect(savedGoal.goalType).toBe('subject_specific');
    expect(savedGoal.rewardText).toBe('ゲーム30分OK！');
  });

  it('allows navigating backwards using the もどる button', () => {
    render(<GoalSettingWizard profile={mockProfile} onSave={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /次へ進む/i }));
    expect(screen.getByText(/2\. 目標値の設定/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /もどる/i }));
    expect(screen.getByText(/1\. 目標タイプの選択/i)).toBeDefined();
  });
});
