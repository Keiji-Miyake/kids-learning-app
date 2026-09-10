import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParentDashboard } from '../components/ParentDashboard';
import { storage } from '../utils/storage';

describe('保護者管理画面 学習履歴詳細アコーディオンUIテスト (Parent Dashboard History Accordion Test)', () => {
  beforeEach(() => {
    localStorage.clear();
    const profile = storage.getActiveProfile();
    storage.addReportData('math', 1, 120, profile.id, 2, {
      unitName: 'かけ算九九',
      sessionType: 'quiz',
      questionRecords: [
        {
          questionId: 'q-test-1',
          questionText: '3 × 7 は？',
          selectedAnswer: '21',
          correctAnswer: '21',
          isCorrect: true,
          explanation: '3を7回足すと21になります。'
        },
        {
          questionId: 'q-test-2',
          questionText: '7 × 8 は？',
          selectedAnswer: '54',
          correctAnswer: '56',
          isCorrect: false,
          explanation: '7 × 8 = 56 です。'
        }
      ]
    });
  });

  it('保護者認証後、日々の記録テーブルに詳細ボタンが表示され、クリックでアコーディオンが展開されること', async () => {
    render(<ParentDashboard onClose={() => {}} />);

    // 初期保護者パスワード入力 (parent)
    const passInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(passInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/ログインして進む/));

    // テーブルの日付行の詳細ボタンを確認
    const detailBtn = await screen.findByRole('button', { name: /詳細を見る/ });
    expect(detailBtn).toBeTruthy();

    // クリックしてアコーディオン展開
    fireEvent.click(detailBtn);

    // 単元名「かけ算九九」、問題文、選んだ答えが表示されていること
    expect(screen.getByText(/かけ算九九/)).toBeTruthy();
    expect(screen.getByText(/3 × 7 は？/)).toBeTruthy();
    expect(screen.getByText(/7 × 8 は？/)).toBeTruthy();
    expect(screen.getByText(/3を7回足すと21になります。/)).toBeTruthy();
  });

  it('「間違えた問題だけ表示」にチェックを入れると、正解した問題が非表示になること', async () => {
    render(<ParentDashboard onClose={() => {}} />);
    const passInput = screen.getByPlaceholderText('保護者パスワード');
    fireEvent.change(passInput, { target: { value: 'parent' } });
    fireEvent.click(screen.getByText(/ログインして進む/));

    const detailBtn = await screen.findByRole('button', { name: /詳細を見る/ });
    fireEvent.click(detailBtn);

    // チェックボックス切り替え
    const filterCheckbox = screen.getByLabelText(/間違えた問題だけ表示/);
    fireEvent.click(filterCheckbox);

    // 正解問題は消え、不正解問題のみ表示
    expect(screen.queryByText(/3 × 7 は？/)).toBeNull();
    expect(screen.getByText(/7 × 8 は？/)).toBeTruthy();
  });
});
