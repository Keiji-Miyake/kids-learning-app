import { describe, it, expect } from 'vitest';
import { curriculumLOD, getDisplayTerm, getCurriculumUnits } from '../data/curriculumLOD';

describe('カリキュラムLOD 2学期制（前期・後期）対応テスト', () => {
  it('getDisplayTerm: 3学期制のときは unit.term を返却する', () => {
    const unit = curriculumLOD[0]; // cos-m1-01 (1学期)
    expect(getDisplayTerm(unit, '3-term')).toBe('1学期');
  });

  it('getDisplayTerm: 2学期制のときは unit.semesterTerm を返却する', () => {
    const unit1 = curriculumLOD[0]; // cos-m1-01 (1学期 / 前期)
    expect(getDisplayTerm(unit1, '2-term')).toBe('前期');

    // くりさがりの ある ひきざん (cos-m1-05: 3学期 / 後期)
    const unit5 = curriculumLOD.find(u => u.code === 'cos-m1-05')!;
    expect(getDisplayTerm(unit5, '2-term')).toBe('後期');
  });

  it('全単元（小1〜中3、全教科）に semesterTerm (前期 | 後期) が正しく設定されている', () => {
    for (const unit of curriculumLOD) {
      expect(['前期', '後期']).toContain(unit.semesterTerm);
    }
  });

  it('フォールバック単元でも getDisplayTerm が正しく動作する', () => {
    const fallbackUnits = getCurriculumUnits('math', 99);
    expect(fallbackUnits.length).toBeGreaterThan(0);
    const fb = fallbackUnits[0];
    expect(getDisplayTerm(fb, '3-term')).toBe('通年');
    expect(getDisplayTerm(fb, '2-term')).toBe('前期');
  });
});
