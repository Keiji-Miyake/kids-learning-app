import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalSettingWizard } from '../components/GoalSettingWizard';
import type { UserProfile, DailyGoal, WeeklySchedule } from '../types';

describe('GoalSettingWizard Weekly Schedule Tests', () => {
  const baseGoal: DailyGoal = {
    targetQuestions: 5,
    targetMinutes: 10,
    rewardText: '基本のご褒美',
    goalType: 'total_count'
  };

  const sampleProfile: UserProfile = {
    id: 'profile-1',
    name: 'テスト君',
    avatarEmoji: '👦',
    dailyGoal: baseGoal,
    weeklySchedule: {
      enabled: false,
      days: {}
    },
    stats: {
      level: 1,
      exp: 0,
      nextLevelExp: 100,
      coins: 0,
      unlockedBadges: [],
      equippedAvatar: 'default'
    }
  };

  it('renders weekly schedule toggle and toggles weekday tabs', () => {
    render(<GoalSettingWizard profile={sampleProfile} onSave={() => {}} />);
    
    // トグルが存在すること
    const toggle = screen.getByLabelText(/曜日ごとにノルマを変える/);
    expect(toggle).toBeDefined();
    expect((toggle as HTMLInputElement).checked).toBe(false);

    // 最初は曜日タブ（月曜日〜日曜日）が表示されていないこと
    expect(screen.queryByText('月曜日')).toBeNull();

    // トグルをONにする
    fireEvent.click(toggle);
    expect((toggle as HTMLInputElement).checked).toBe(true);

    // 曜日タブが表示されること
    expect(screen.getByText('月')).toBeDefined();
    expect(screen.getByText('金')).toBeDefined();
    expect(screen.getByText('日')).toBeDefined();
  });

  it('allows configuring different goals per weekday and saves weeklySchedule', () => {
    const handleSave = vi.fn();
    render(<GoalSettingWizard profile={sampleProfile} onSave={handleSave} />);

    // トグルをON
    const toggle = screen.getByLabelText(/曜日ごとにノルマを変える/);
    fireEvent.click(toggle);

    // 「月」タブをクリック
    fireEvent.click(screen.getByText('月'));

    // Step 2 へ進む
    fireEvent.click(screen.getByText(/次へ進む/));

    // 問題数を変更（例: 20問）
    const countSelect = screen.getByLabelText(/1日の目標問題数/);
    fireEvent.change(countSelect, { target: { value: '20' } });


    // Step 3 へ進む
    fireEvent.click(screen.getByText(/次へ進む/));


    // 保存ボタンをクリック
    const saveBtn = screen.getByText(/ノルマ・ご褒美を保存する/);
    fireEvent.click(saveBtn);


    expect(handleSave).toHaveBeenCalledTimes(1);
    const [savedBaseGoal, savedSchedule] = handleSave.mock.calls[0] as [DailyGoal, WeeklySchedule];
    expect(savedBaseGoal).toBeDefined();
    expect(savedSchedule).toBeDefined();
    expect(savedSchedule.enabled).toBe(true);
    expect(savedSchedule.days?.mon?.targetQuestions).toBe(20);
  });

  it('supports copy to weekdays and copy to all days', () => {
    const handleSave = vi.fn();
    render(<GoalSettingWizard profile={sampleProfile} onSave={handleSave} />);

    // トグルON
    fireEvent.click(screen.getByLabelText(/曜日ごとにノルマを変える/));

    // 月曜タブで問題数を15に変更
    fireEvent.click(screen.getByText('月'));
    fireEvent.click(screen.getByText(/次へ進む/));
    const countSelect = screen.getByLabelText(/1日の目標問題数/);
    fireEvent.change(countSelect, { target: { value: '15' } });

    // 「平日にコピー (月〜金)」をクリック
    fireEvent.click(screen.getByText(/平日にコピー/));

    // Step 3 へ進んで保存
    fireEvent.click(screen.getByText(/次へ進む/));
    fireEvent.click(screen.getByText(/ノルマ・ご褒美を保存する/));

    expect(handleSave).toHaveBeenCalledTimes(1);
    const [, savedSchedule] = handleSave.mock.calls[0] as [DailyGoal, WeeklySchedule];
    expect(savedSchedule.days?.mon?.targetQuestions).toBe(15);
    expect(savedSchedule.days?.tue?.targetQuestions).toBe(15);
    expect(savedSchedule.days?.wed?.targetQuestions).toBe(15);
    expect(savedSchedule.days?.thu?.targetQuestions).toBe(15);
    expect(savedSchedule.days?.fri?.targetQuestions).toBe(15);
    expect(savedSchedule.days?.sat).toBeUndefined(); // 土曜はコピーされていない
  });
});

