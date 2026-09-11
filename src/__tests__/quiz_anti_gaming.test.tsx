import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QuizScreen from '../components/QuizScreen';
import type { Question } from '../types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    subject: 'math',
    grade: 3,
    questionText: '問題1: 5 + 5 は？',
    options: ['8', '10', '12', '15'],
    correctAnswer: '10',
    explanation: '5 + 5 = 10 です。'
  },
  {
    id: 'q2',
    subject: 'math',
    grade: 3,
    questionText: '問題2: 3 × 3 は？',
    options: ['6', '9', '12', '15'],
    correctAnswer: '9',
    explanation: '3 × 3 = 9 です。'
  },
  {
    id: 'q3',
    subject: 'math',
    grade: 3,
    questionText: '問題3: 10 - 4 は？',
    options: ['4', '5', '6', '7'],
    correctAnswer: '6',
    explanation: '10 - 4 = 6 です。'
  }
];

describe('クイズ連打・放置防止テスト (Quiz Anti-Gaming Tests)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('問題表示直後(800ms未満)は選択肢をクリックしても解答処理が走らないこと（連打ガード）', () => {
    const onFinish = vi.fn();
    render(<QuizScreen questions={mockQuestions} onFinish={onFinish} onCancel={() => {}} />);

    const optionBtn = screen.getByText('10');
    // 出題直後（0ms）にクリック
    fireEvent.click(optionBtn);

    // 解説や「つぎへ」ボタンはまだ表示されないこと
    expect(screen.queryByText(/つぎの問題へ/)).toBeNull();

    // 800ms 経過後
    act(() => {
      vi.advanceTimersByTime(850);
    });

    // 再度クリックすると解答できること
    fireEvent.click(optionBtn);
    expect(screen.getByText(/つぎの問題へ/)).toBeDefined();
  });

  it('2問連続でタイムアウト(放置)した場合に「きゅうけいちゅう」一時停止画面が表示されること', () => {
    const onFinish = vi.fn();
    render(<QuizScreen questions={mockQuestions} onFinish={onFinish} onCancel={() => {}} />);

    // 1問目: 30秒経過でタイムアウト
    act(() => {
      vi.advanceTimersByTime(31000);
    });
    // 1問目回答後、次の問題へ進む
    const nextBtn1 = screen.getByText('つぎの問題へ 👉');
    fireEvent.click(nextBtn1);

    // 2問目: 800msロック解除を待って、さらに30秒経過でタイムアウト
    act(() => {
      vi.advanceTimersByTime(31000);
    });

    // 2問連続放置により「きゅうけいちゅう」モーダルが表示されていること
    expect(screen.getByText('きゅうけいちゅう')).toBeDefined();
    const resumeBtn = screen.getByRole('button', { name: /つづける/ });
    expect(resumeBtn).toBeDefined();

    // つづけるボタンを押すとモーダルが閉じること
    fireEvent.click(resumeBtn);
    expect(screen.queryByText('きゅうけいちゅう')).toBeNull();
  });
});
