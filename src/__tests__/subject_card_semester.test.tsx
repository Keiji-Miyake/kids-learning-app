import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubjectCard } from '../components/SubjectCard';

describe('SubjectCard 2学期制ラベル表示テスト', () => {
  it('semesterSystem が 2-term の場合、単元オプションに [前期] / [後期] が表示される', () => {
    render(
      <SubjectCard
        id="math"
        title="算数"
        emoji="🧮"
        colorClass="math-color"
        description="算数のテスト"
        defaultGrade={1}
        semesterSystem="2-term"
        onSelect={vi.fn()}
      />
    );

    // 単元ドロップダウン（2つ目の combobox）のオプション内に [前期] が含まれることを確認
    const select = screen.getAllByRole('combobox')[1];
    expect(select.innerHTML).toContain('[前期]');
    expect(select.innerHTML).toContain('[後期]');
    expect(select.innerHTML).not.toContain('[1学期]');
  });

  it('semesterSystem が 3-term または未指定の場合、単元オプションに [1学期] / [2学期] / [3学期] が表示される', () => {
    render(
      <SubjectCard
        id="math"
        title="算数"
        emoji="🧮"
        colorClass="math-color"
        description="算数のテスト"
        defaultGrade={1}
        onSelect={vi.fn()}
      />
    );

    const select = screen.getAllByRole('combobox')[1];
    expect(select.innerHTML).toContain('[1学期]');
    expect(select.innerHTML).not.toContain('[前期]');
  });

  it('年間単元一覧アコーディオンを開いた際、2学期制なら [前期] / [後期] が表示される', () => {
    render(
      <SubjectCard
        id="math"
        title="算数"
        emoji="🧮"
        colorClass="math-color"
        description="算数のテスト"
        defaultGrade={1}
        semesterSystem="2-term"
        onSelect={vi.fn()}
      />
    );

    // アコーディオンを開く
    const toggleBtn = screen.getByRole('button', { name: /年間単元一覧/i });
    fireEvent.click(toggleBtn);

    // リスト内に「前期」「後期」が表示され、「1学期」が含まれないことを確認
    const terms = screen.getAllByText(/前期|後期/);
    expect(terms.length).toBeGreaterThan(0);
    expect(screen.queryByText('1学期')).toBeNull();
  });
});
