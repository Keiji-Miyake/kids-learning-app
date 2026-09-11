import { describe, it, expect } from 'vitest';
import { calculateGradeFromBirthDate, formatGradeLabel } from '../utils/gradeCalculator';

describe('gradeCalculator: 日本の学校教育法に基づく学年判定テスト', () => {
  // 基準日: 2026年9月11日（2026年度中）
  const baseDate = new Date('2026-09-11T00:00:00Z');

  it('2017年4月2日生まれは2026年9月時点で小学3年生（8〜9歳）', () => {
    const result = calculateGradeFromBirthDate('2017-04-02', baseDate);
    expect(result.grade).toBe(3);
    expect(result.label).toBe('小学3年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('2018年4月1日生まれ（早生まれ）は2026年9月時点で小学3年生', () => {
    const result = calculateGradeFromBirthDate('2018-04-01', baseDate);
    expect(result.grade).toBe(3);
    expect(result.label).toBe('小学3年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('2018年4月2日生まれは2026年9月時点で小学2年生', () => {
    const result = calculateGradeFromBirthDate('2018-04-02', baseDate);
    expect(result.grade).toBe(2);
    expect(result.label).toBe('小学2年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('2011年4月2日生まれは2026年9月時点で中学3年生（grade 9）', () => {
    const result = calculateGradeFromBirthDate('2011-04-02', baseDate);
    expect(result.grade).toBe(9);
    expect(result.label).toBe('中学3年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('2027年4月1日に新年度を迎え、2017年4月2日生まれは小学4年生に進級する', () => {
    const nextFiscalYear = new Date('2027-04-01T00:00:00Z');
    const result = calculateGradeFromBirthDate('2017-04-02', nextFiscalYear);
    expect(result.grade).toBe(4);
    expect(result.label).toBe('小学4年');
    expect(result.isSchoolAge).toBe(true);
  });

  it('未就学児（6歳未満）の場合は grade: 0, label: 未就学', () => {
    const result = calculateGradeFromBirthDate('2022-05-01', baseDate);
    expect(result.grade).toBe(0);
    expect(result.label).toBe('未就学');
    expect(result.isSchoolAge).toBe(false);
  });

  it('高校生以上（義務教育修了）の場合は grade: 10, label: 高校生以上', () => {
    const result = calculateGradeFromBirthDate('2010-01-15', baseDate);
    expect(result.grade).toBe(10);
    expect(result.label).toBe('高校生以上');
    expect(result.isSchoolAge).toBe(false);
  });

  it('formatGradeLabel が 1〜9 の数値を正しく日本語の学年名にフォーマットする', () => {
    expect(formatGradeLabel(1)).toBe('小学1年');
    expect(formatGradeLabel(6)).toBe('小学6年');
    expect(formatGradeLabel(7)).toBe('中学1年');
    expect(formatGradeLabel(9)).toBe('中学3年');
    expect(formatGradeLabel(0)).toBe('未就学');
    expect(formatGradeLabel(10)).toBe('高校生以上');
  });
});
