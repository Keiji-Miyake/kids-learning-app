import { describe, it, expect } from 'vitest';
import { generateDynamicQuestion } from '../utils/questionGenerator';

describe('Advanced Dynamic Question Generator for all subjects', () => {
  it('should generate advanced applied math questions (word problems, Ohm, time zone, etc.)', () => {
    // 算数・数学：速さ・割合文章題 / 一次関数変化の割合 / 円周角
    const math1 = generateDynamicQuestion('math', 8, '一次関数');
    expect(math1.questionText).toMatch(/一次関数|傾き|変化の割合|y =/);

    const math2 = generateDynamicQuestion('math', 8, '連立方程式');
    expect(math2.questionText).toMatch(/連立方程式|x ＋ y|代入/);

    // 理科：オームの法則
    const science1 = generateDynamicQuestion('science', 8, 'オームの法則');
    expect(science1.questionText).toMatch(/電圧|電流|抵抗|オーム/);

    // 社会：時差計算
    const social1 = generateDynamicQuestion('social', 7, '時差計算');
    expect(social1.questionText).toMatch(/時差|経度|時間/);

    // 英語：関係代名詞 / 受動態
    const english1 = generateDynamicQuestion('english', 9, '関係代名詞');
    expect(english1.questionText).toMatch(/関係代名詞|who|which|that/);
  });
});
