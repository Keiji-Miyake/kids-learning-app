import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileSelectorModal } from '../components/ProfileSelectorModal';

describe('未ログイン・プロフィール選択画面からの管理画面アクセス (Direct Parent Dashboard Access)', () => {
  it('プロフィール選択モーダルに「⚙️ 保護者管理画面」ボタンが表示され、クリック時にコールバックが呼ばれること', () => {
    const onOpenDashboard = vi.fn();
    render(
      <ProfileSelectorModal
        onSelectProfile={() => {}}
        onClose={() => {}}
        onOpenDashboard={onOpenDashboard}
      />
    );

    const dashboardBtn = screen.getByRole('button', { name: /保護者管理画面/ });
    expect(dashboardBtn).toBeDefined();

    fireEvent.click(dashboardBtn);
    expect(onOpenDashboard).toHaveBeenCalledTimes(1);
  });
});
