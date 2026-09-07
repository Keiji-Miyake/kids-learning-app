import type { Question, Subject } from '../types';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffle = <T>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// 🌟 選択肢がすべてユニーク（重複なし）であることを強制・保証する安全関数
export const ensureUniqueOptions = (options: string[], correctAnswer: string, subject: Subject): string[] => {
  const uniqueSet = new Set<string>();
  uniqueSet.add(correctAnswer);
  options.forEach(opt => {
    if (opt && opt.trim() !== '') uniqueSet.add(opt);
  });

  const uniqueArr = Array.from(uniqueSet);

  const fallbackPools: Record<Subject, string[]> = {
    math: ['0', '1', '2', '5', '10', '100', '-1', 'x = 0', 'y = 0'],
    japanese: ['漢字', '言葉', '読み方', '文法', 'ことわざ'],
    science: ['水', '空気', '酸素', '二酸化炭素', 'エネルギー', '細胞'],
    social: ['日本', '東京', '歴史', '憲法', '世界'],
    english: ['apple', 'book', 'English', 'Japan', 'student']
  };

  const pool = fallbackPools[subject] || ['選択肢A', '選択肢B', '選択肢C', '選択肢D'];
  let counter = 1;

  while (uniqueArr.length < 4) {
    const fallback = `${pool[(counter - 1) % pool.length]} (${counter})`;
    if (!uniqueArr.includes(fallback)) {
      uniqueArr.push(fallback);
    }
    counter++;
  }

  return shuffle(uniqueArr.slice(0, 4));
};

// ==========================================
// 1. 🧮 算数・数学（小1〜中3）
// ==========================================
const generateMath = (grade: number, uName: string, idSuffix: string): Question => {
  // ----------------------------------------------------
  // 小1: かず、足し算、引き算
  // ----------------------------------------------------
  if (grade === 1 || uName.includes('たしざん') || uName.includes('ひきざん') || uName.includes('かず')) {
    const isSubtraction = uName.includes('ひきざん') || Math.random() < 0.5;
    if (isSubtraction) {
      const a = getRandomInt(4, 18);
      const b = getRandomInt(1, a - 1);
      const ans = a - b;
      const opts = shuffle([`${ans}`, `${ans + 1}`, `${Math.max(0, ans - 1)}`, `${ans + 2}`]);
      return {
        id: `dyn-m1-sub-${idSuffix}`,
        subject: 'math',
        grade: 1,
        questionText: `ひきざんの もんだい：「${a} - ${b}」の こたえは どれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${a} から ${b} を ひくと ${ans} に なります。`
      };
    } else {
      const a = getRandomInt(1, 10);
      const b = getRandomInt(1, 10);
      const ans = a + b;
      const opts = shuffle([`${ans}`, `${ans + 1}`, `${Math.max(1, ans - 1)}`, `${ans + 2}`]);
      return {
        id: `dyn-m1-add-${idSuffix}`,
        subject: 'math',
        grade: 1,
        questionText: `たしざんの もんだい：「${a} ＋ ${b}」の こたえは どれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${a} と ${b} を あわせると ${ans} に なります。`
      };
    }
  }

  // ----------------------------------------------------
  // 小2: 九九、単位、加減算
  // ----------------------------------------------------
  if (grade === 2 || uName.includes('九九') || uName.includes('かけ算')) {
    const mode = getRandomInt(1, 3);
    if (mode === 1 || uName.includes('九九') || uName.includes('かけ算')) {
      const a = getRandomInt(2, 9);
      const b = getRandomInt(2, 9);
      const ans = a * b;
      const opts = shuffle([`${ans}`, `${ans + a}`, `${ans - 2}`, `${ans + 4}`]);
      return {
        id: `dyn-m2-kuku-${idSuffix}`,
        subject: 'math',
        grade: 2,
        questionText: `九九のもんだい：「${a} × ${b}」の こたえは どれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${a} × ${b} = ${ans} です。`
      };
    } else if (mode === 2) {
      const units = [
        { q: '1メートル（1m）は なんセンチメートル（cm）かな？', a: '100cm', w: ['10cm', '1000cm', '50cm'] },
        { q: '1リットル（1L）は なんデシリットル（dL）かな？', a: '10dL', w: ['100dL', '5dL', '1dL'] },
        { q: '1リットル（1L）は なんミリリットル（mL）かな？', a: '1000mL', w: ['100mL', '10mL', '500mL'] },
        { q: '1時間は なんぷん（分）かな？', a: '60分', w: ['100分', '30分', '24分'] },
        { q: '1日は なんじかん（時間）かな？', a: '24時間', w: ['12時間', '60時間', '48時間'] },
        { q: '1分は なんびょう（秒）かな？', a: '60秒', w: ['100秒', '30秒', '10秒'] }
      ];
      const target = units[getRandomInt(0, units.length - 1)];
      return {
        id: `dyn-m2-unit-${idSuffix}`,
        subject: 'math',
        grade: 2,
        questionText: target.q,
        options: ensureUniqueOptions([target.a, ...target.w], target.a, 'math'),
        correctAnswer: target.a,
        explanation: `正解は ${target.a} です。`
      };
    } else {
      const a = getRandomInt(20, 60);
      const b = getRandomInt(10, 35);
      const ans = a + b;
      const opts = shuffle([`${ans}`, `${ans + 10}`, `${ans - 2}`, `${ans + 2}`]);
      return {
        id: `dyn-m2-add2-${idSuffix}`,
        subject: 'math',
        grade: 2,
        questionText: `2けたの たしざん：「${a} ＋ ${b}」の こたえは どれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${a} ＋ ${b} = ${ans} です。`
      };
    }
  }

  // ----------------------------------------------------
  // 小3: 割り算、あまり、小数・分数、円と球
  // ----------------------------------------------------
  if (grade === 3 || uName.includes('わり算') || uName.includes('あまり')) {
    if (uName.includes('あまりのある') || (uName.includes('あまり') && Math.random() < 0.6)) {
      const divisor = getRandomInt(3, 9);
      const quotient = getRandomInt(2, 9);
      const remainder = getRandomInt(1, divisor - 1);
      const dividend = divisor * quotient + remainder;
      const ans = `${quotient} あまり ${remainder}`;
      const opts = shuffle([
        ans,
        `${quotient} あまり ${remainder + 1}`,
        `${quotient + 1} あまり ${remainder}`,
        `${quotient - 1} あまり ${remainder}`
      ]);
      return {
        id: `dyn-m3-divrem-${idSuffix}`,
        subject: 'math',
        grade: 3,
        questionText: `あまりのある わり算：「${dividend} ÷ ${divisor}」の こたえは？`,
        options: ensureUniqueOptions(opts, ans, 'math'),
        correctAnswer: ans,
        explanation: `${dividend} ÷ ${divisor} = ${quotient} あまり ${remainder} です。`
      };
    } else {
      const b = getRandomInt(2, 9);
      const ans = getRandomInt(2, 9);
      const a = b * ans;
      const opts = shuffle([`${ans}`, `${ans + 1}`, `${Math.max(1, ans - 1)}`, `${ans + 2}`]);
      return {
        id: `dyn-m3-div-${idSuffix}`,
        subject: 'math',
        grade: 3,
        questionText: `わり算のもんだい：「${a} ÷ ${b}」の こたえは どれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${b} × ${ans} = ${a} なので、${a} ÷ ${b} = ${ans} です。`
      };
    }
  }

  // ----------------------------------------------------
  // 小4〜小6: 面積、分数、割合、速さ
  // ----------------------------------------------------
  if (grade >= 4 && grade <= 6) {
    if (grade === 4 || uName.includes('面積')) {
      const w = getRandomInt(3, 15);
      const h = getRandomInt(3, 12);
      const ans = w * h;
      const opts = shuffle([`${ans}㎠`, `${(w + h) * 2}㎠`, `${ans + 4}㎠`, `${ans - 3}㎠`]);
      return {
        id: `dyn-m4-area-${idSuffix}`,
        subject: 'math',
        grade: 4,
        questionText: `たて ${h}cm、横 ${w}cm の長方形の面積はいくつかな？`,
        options: ensureUniqueOptions(opts, `${ans}㎠`, 'math'),
        correctAnswer: `${ans}㎠`,
        explanation: `長方形の面積 ＝ たて × 横 ＝ ${h} × ${w} ＝ ${ans}㎠ です。`
      };
    }
    if (grade === 5 || uName.includes('小数') || uName.includes('分数') || uName.includes('割合')) {
      const base = getRandomInt(2, 8) * 10;
      const pct = getRandomInt(1, 5) * 10;
      const ans = (base * pct) / 100;
      const opts = shuffle([`${ans}`, `${ans * 2}`, `${ans + 5}`, `${Math.max(1, ans - 3)}`]);
      return {
        id: `dyn-m5-pct-${idSuffix}`,
        subject: 'math',
        grade: 5,
        questionText: `${base} の ${pct}％（割合）は いくつかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `${base} × ${pct / 100} = ${ans} です。`
      };
    }
    const speed = getRandomInt(30, 90);
    const hours = getRandomInt(2, 5);
    const dist = speed * hours;
    const opts = shuffle([`${dist}km`, `${dist + speed}km`, `${dist - 20}km`, `${speed * 2}km`]);
    return {
      id: `dyn-m6-speed-${idSuffix}`,
      subject: 'math',
      grade: 6,
      questionText: `時速 ${speed}km の自動車が ${hours}時間 走ったときの道のりは？`,
      options: ensureUniqueOptions(opts, `${dist}km`, 'math'),
      correctAnswer: `${dist}km`,
      explanation: `道のり ＝ 速さ × 時間 ＝ ${speed} × ${hours} ＝ ${dist}km です。`
    };
  }

  // ----------------------------------------------------
  // 中1 (grade 7): 正負の数、文字式、一次方程式、比例・反比例
  // ----------------------------------------------------
  if (grade === 7 || uName.includes('一次方程式') || uName.includes('正の数') || uName.includes('文字の式') || uName.includes('比例')) {
    if (uName.includes('一次方程式') || uName.includes('方程式')) {
      const a = getRandomInt(2, 6);
      const x = getRandomInt(-5, 8);
      const b = getRandomInt(1, 15);
      const c = a * x + b;
      const opts = shuffle([`x = ${x}`, `x = ${x + 1}`, `x = ${-x}`, `x = ${x + 2}`]);
      return {
        id: `dyn-m7-eq-${idSuffix}`,
        subject: 'math',
        grade: 7,
        questionText: `一次方程式 「${a}x ＋ ${b} = ${c}」 を解きなさい。`,
        options: ensureUniqueOptions(opts, `x = ${x}`, 'math'),
        correctAnswer: `x = ${x}`,
        explanation: `${a}x = ${c} - ${b} = ${a * x}、両辺を ${a} で割ると x = ${x} です。`
      };
    } else if (uName.includes('文字')) {
      const a = getRandomInt(2, 7);
      const b = getRandomInt(2, 7);
      const ans = a + b;
      const opts = shuffle([`${ans}a`, `${a * b}a`, `${ans}a²`, `${a - b}a`]);
      return {
        id: `dyn-m7-poly-${idSuffix}`,
        subject: 'math',
        grade: 7,
        questionText: `同類項の計算：「${a}a ＋ ${b}a」 を計算しなさい。`,
        options: ensureUniqueOptions(opts, `${ans}a`, 'math'),
        correctAnswer: `${ans}a`,
        explanation: `(${a} + ${b})a = ${ans}a です。`
      };
    } else if (uName.includes('比例')) {
      const a = getRandomInt(2, 6);
      const x = getRandomInt(2, 5);
      const y = a * x;
      const opts = shuffle([`a = ${a}`, `a = ${y}`, `a = ${a + 1}`, `a = ${-a}`]);
      return {
        id: `dyn-m7-prop-${idSuffix}`,
        subject: 'math',
        grade: 7,
        questionText: `y が x に比例し、x = ${x} のとき y = ${y} です。比例定数 a を求めなさい。 (y = ax)`,
        options: ensureUniqueOptions(opts, `a = ${a}`, 'math'),
        correctAnswer: `a = ${a}`,
        explanation: `y = ax より、${y} = a × ${x} なので a = ${y} ÷ ${x} = ${a} です。`
      };
    } else {
      const a = getRandomInt(-12, -2);
      const b = getRandomInt(2, 12);
      const ans = a + b;
      const opts = shuffle([`${ans}`, `${ans - 2}`, `${-ans}`, `${ans + 3}`]);
      return {
        id: `dyn-m7-num-${idSuffix}`,
        subject: 'math',
        grade: 7,
        questionText: `正の数・負の数の計算：「(${a}) ＋ ${b}」 の答えはどれかな？`,
        options: ensureUniqueOptions(opts, `${ans}`, 'math'),
        correctAnswer: `${ans}`,
        explanation: `(${a}) ＋ ${b} = ${ans} です。`
      };
    }
  }

  // ----------------------------------------------------
  // 中2 (grade 8): 連立方程式、一次関数、平行と合同・確率
  // ----------------------------------------------------
  if (grade === 8 || uName.includes('一次関数') || uName.includes('連立') || uName.includes('確率') || uName.includes('合同')) {
    if (uName.includes('連立方程式') || uName.includes('連立')) {
      const xVal = getRandomInt(1, 6);
      const yVal = getRandomInt(1, 6);
      const c1 = xVal + yVal;
      const c2 = 2 * xVal + yVal;
      const opts = shuffle([
        `x = ${xVal}, y = ${yVal}`,
        `x = ${xVal + 1}, y = ${yVal + 2}`,
        `x = ${xVal + 2}, y = ${yVal + 1}`,
        `x = ${yVal + 3}, y = ${xVal}`
      ]);
      return {
        id: `dyn-m8-sys-${idSuffix}`,
        subject: 'math',
        grade: 8,
        questionText: `連立方程式 「x ＋ y = ${c1} ,  2x ＋ y = ${c2}」 を解きなさい。`,
        options: ensureUniqueOptions(opts, `x = ${xVal}, y = ${yVal}`, 'math'),
        correctAnswer: `x = ${xVal}, y = ${yVal}`,
        explanation: `下の式から上の式を引くと x = ${c2 - c1} = ${xVal}。よって y = ${yVal} です。`
      };
    } else if (uName.includes('一次関数') || uName.includes('傾き')) {
      const a = getRandomInt(-5, 6);
      const realA = a === 0 ? 3 : a;
      const b = getRandomInt(-8, 9);
      const bStr = b >= 0 ? `＋ ${b}` : `- ${Math.abs(b)}`;
      const opts = shuffle([`変化の割合: ${realA}`, `変化の割合: ${b}`, `変化の割合: ${realA + 1}`, `変化の割合: ${-realA}`]);
      return {
        id: `dyn-m8-func1-${idSuffix}`,
        subject: 'math',
        grade: 8,
        questionText: `一次関数 「y = ${realA}x ${bStr}」 の変化の割合（傾き）を求めなさい。`,
        options: ensureUniqueOptions(opts, `変化の割合: ${realA}`, 'math'),
        correctAnswer: `変化の割合: ${realA}`,
        explanation: `y = ax + b において、変化の割合（傾き）は x の係数 a であるため、${realA} です。`
      };
    } else {
      // 確率・平行と合同の豊富なバリエーション
      const pMode = getRandomInt(1, 5);
      if (pMode === 1) {
        const targetNumber = getRandomInt(1, 6);
        return {
          id: `dyn-m8-prob1-${idSuffix}`,
          subject: 'math',
          grade: 8,
          questionText: `1個のサイコロを投げるとき、${targetNumber}の目が出る確率はどれかな？`,
          options: ensureUniqueOptions(['1/6', '1/2', '1/3', '5/6'], '1/6', 'math'),
          correctAnswer: '1/6',
          explanation: `サイコロの目は全部で6通りあり、${targetNumber}の目は1通りなので 1/6 です。`
        };
      } else if (pMode === 2) {
        const threshold = getRandomInt(3, 5);
        const count = 7 - threshold;
        const ans = count === 4 ? '2/3' : count === 3 ? '1/2' : '1/3';
        return {
          id: `dyn-m8-prob2-${idSuffix}`,
          subject: 'math',
          grade: 8,
          questionText: `1個のサイコロを投げるとき、${threshold}以上の目が出る確率はどれかな？`,
          options: ensureUniqueOptions(['2/3', '1/2', '1/3', '5/6'], ans, 'math'),
          correctAnswer: ans,
          explanation: `${threshold}以上の目は ${count} 通りあるので、${count}/6 ＝ ${ans} です。`
        };
      } else if (pMode === 3) {
        const red = getRandomInt(2, 5);
        const white = getRandomInt(2, 5);
        const total = red + white;
        return {
          id: `dyn-m8-prob3-${idSuffix}`,
          subject: 'math',
          grade: 8,
          questionText: `赤玉が ${red}個、白玉が ${white}個入った袋から玉を1個取り出すとき、赤玉が出る確率は？`,
          options: ensureUniqueOptions([`${red}/${total}`, `${white}/${total}`, `1/${total}`, `${red}/${white}`], `${red}/${total}`, 'math'),
          correctAnswer: `${red}/${total}`,
          explanation: `全体の玉の数は ${total}個、赤玉は ${red}個なので、確率は ${red}/${total} です。`
        };
      } else if (pMode === 4) {
        const angle = getRandomInt(4, 12) * 10;
        const supp = 180 - angle;
        return {
          id: `dyn-m8-geo1-${idSuffix}`,
          subject: 'math',
          grade: 8,
          questionText: `平行な2直線に1本の直線が交わるとき、一方の角が ${angle}° ならば、その同位角の大きさは何度？`,
          options: ensureUniqueOptions([`${angle}°`, `${supp}°`, `${angle + 10}°`, `${supp - 10}°`], `${angle}°`, 'math'),
          correctAnswer: `${angle}°`,
          explanation: `平行線の同位角は等しいので、大きさは同じ ${angle}° です。`
        };
      } else {
        const conds = [
          { a: '3組の辺がそれぞれ等しい', w: ['3つの角が等しい', '2組の辺が等しい', '面積が等しい'] },
          { a: '2組の辺とその間の角がそれぞれ等しい', w: ['2組の角と1辺が等しい', '3つの角が等しい', '底辺と高さが等しい'] },
          { a: '1組の辺とその両端の角がそれぞれ等しい', w: ['1組の辺と1つの角が等しい', 'すべての角が直角', '対角線が等しい'] }
        ];
        const item = conds[getRandomInt(0, conds.length - 1)];
        return {
          id: `dyn-m8-geo2-${idSuffix}`,
          subject: 'math',
          grade: 8,
          questionText: `次のうち、三角形の合同条件として正しいものはどれかな？`,
          options: ensureUniqueOptions([item.a, ...item.w], item.a, 'math'),
          correctAnswer: item.a,
          explanation: `三角形の合同条件は「${item.a}」です。`
        };
      }
    }
  }

  // ----------------------------------------------------
  // 中3 (grade 9): 多項式展開、平方根、二次方程式、y=ax²、相似、三平方
  // ----------------------------------------------------
  if (uName.includes('三平方') || uName.includes('ピタゴラス')) {
    const triplets = [
      { a: 3, b: 4, c: 5 },
      { a: 5, b: 12, c: 13 },
      { a: 6, b: 8, c: 10 },
      { a: 8, b: 15, c: 17 },
      { a: 9, b: 12, c: 15 },
      { a: 7, b: 24, c: 25 },
      { a: 12, b: 16, c: 20 },
      { a: 15, b: 20, c: 25 },
      { a: 10, b: 24, c: 26 },
      { a: 20, b: 21, c: 29 }
    ];
    const item = triplets[getRandomInt(0, triplets.length - 1)];
    const opts = shuffle([`${item.c}cm`, `${item.c + 2}cm`, `${item.a + item.b}cm`, `${item.c - 1}cm`]);
    return {
      id: `dyn-m9-pytha-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `直角をはさむ2辺が ${item.a}cm, ${item.b}cm の直角三角形の斜辺の長さを求めなさい。`,
      options: ensureUniqueOptions(opts, `${item.c}cm`, 'math'),
      correctAnswer: `${item.c}cm`,
      explanation: `三平方の定理 a² + b² = c² より、${item.a}² + ${item.b}² = ${item.a * item.a + item.b * item.b} = ${item.c}²。斜辺は ${item.c}cm です。`
    };
  }

  if (uName.includes('平方根') || uName.includes('√')) {
    const a = getRandomInt(2, 7);
    const b = getRandomInt(2, 7);
    const product = a * a * b;
    const opts = shuffle([`${a}√${b}`, `${b}√${a}`, `${a * b}`, `√${a + b}`]);
    return {
      id: `dyn-m9-sqrt-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `√${product} を a√b の形にしなさい。`,
      options: ensureUniqueOptions(opts, `${a}√${b}`, 'math'),
      correctAnswer: `${a}√${b}`,
      explanation: `√${product} = √(${a}² × ${b}) = ${a}√${b} です。`
    };
  }

  if (uName.includes('二次方程式')) {
    const p = getRandomInt(1, 7);
    const q = getRandomInt(p + 1, 10);
    const b = -(p + q);
    const c = p * q;
    const bSign = b >= 0 ? `＋ ${b}` : `- ${Math.abs(b)}`;
    const opts = shuffle([`x = ${p}, ${q}`, `x = ${-p}, ${-q}`, `x = ${p}, ${-q}`, `x = ${-p}, ${q}`]);
    return {
      id: `dyn-m9-quad-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `二次方程式 「x² ${bSign}x ＋ ${c} = 0」 を解きなさい。`,
      options: ensureUniqueOptions(opts, `x = ${p}, ${q}`, 'math'),
      correctAnswer: `x = ${p}, ${q}`,
      explanation: `(x - ${p})(x - ${q}) = 0 と因数分解できるので、x = ${p}, ${q} です。`
    };
  }

  if (uName.includes('y=ax²') || uName.includes('放物線')) {
    const a = getRandomInt(1, 5);
    const x = getRandomInt(-5, 5);
    const realX = x === 0 ? 3 : x;
    const y = a * realX * realX;
    const opts = shuffle([`y = ${y}`, `y = ${y + 2}`, `y = ${y - 3}`, `y = ${a * realX}`]);
    return {
      id: `dyn-m9-qfunc-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `関数 y = ${a}x² について、x = ${realX} のときの y の値を求めなさい。`,
      options: ensureUniqueOptions(opts, `y = ${y}`, 'math'),
      correctAnswer: `y = ${y}`,
      explanation: `y = ${a} × (${realX})² = ${a} × ${realX * realX} = ${y} です。`
    };
  }

  if (uName.includes('相似') || uName.includes('円周角')) {
    const centralAngle = getRandomInt(3, 16) * 10;
    const inscribedAngle = centralAngle / 2;
    const opts = shuffle([`${inscribedAngle}°`, `${centralAngle}°`, `${inscribedAngle + 10}°`, `${centralAngle * 2}°`]);
    return {
      id: `dyn-m9-circle-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `同じ弧に対する中心角が ${centralAngle}° のとき、円周角の大きさを求めなさい。`,
      options: ensureUniqueOptions(opts, `${inscribedAngle}°`, 'math'),
      correctAnswer: `${inscribedAngle}°`,
      explanation: `円周角は中心角の半分なので ${centralAngle}° ÷ 2 = ${inscribedAngle}° です。`
    };
  }

  // 中3デフォルト（多項式の展開・因数分解）：無数にユニーク生成可能
  const mode = getRandomInt(1, 3);
  if (mode === 1) {
    const a = getRandomInt(2, 9);
    const aSq = a * a;
    const opts = shuffle([`(x ＋ ${a})(x - ${a})`, `(x - ${a})²`, `(x ＋ ${a})²`, `x(x - ${aSq})`]);
    return {
      id: `dyn-m9-factor-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `「x² - ${aSq}」 を因数分解しなさい。`,
      options: ensureUniqueOptions(opts, `(x ＋ ${a})(x - ${a})`, 'math'),
      correctAnswer: `(x ＋ ${a})(x - ${a})`,
      explanation: `公式 a² - b² = (a + b)(a - b) より、(x + ${a})(x - ${a}) です。`
    };
  } else if (mode === 2) {
    const a = getRandomInt(1, 8);
    const b = getRandomInt(a + 1, 9);
    const sum = a + b;
    const prod = a * b;
    const opts = shuffle([`(x ＋ ${a})(x ＋ ${b})`, `(x - ${a})(x - ${b})`, `(x ＋ ${sum})(x ＋ ${prod})`, `(x ＋ ${a})²`]);
    return {
      id: `dyn-m9-fact2-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `「x² ＋ ${sum}x ＋ ${prod}」 を因数分解しなさい。`,
      options: ensureUniqueOptions(opts, `(x ＋ ${a})(x ＋ ${b})`, 'math'),
      correctAnswer: `(x ＋ ${a})(x ＋ ${b})`,
      explanation: `足して ${sum}、かけて ${prod} になる2数は ${a} と ${b} なので、(x + ${a})(x + ${b}) です。`
    };
  } else {
    const a = getRandomInt(2, 8);
    const ans = a * a;
    const opts = shuffle([`x² ＋ ${2 * a}x ＋ ${ans}`, `x² ＋ ${ans}`, `x² ＋ ${a}x ＋ ${ans}`, `x² - ${ans}`]);
    return {
      id: `dyn-m9-expand-${idSuffix}`,
      subject: 'math',
      grade: 9,
      questionText: `(x ＋ ${a})² を展開しなさい。`,
      options: ensureUniqueOptions(opts, `x² ＋ ${2 * a}x ＋ ${ans}`, 'math'),
      correctAnswer: `x² ＋ ${2 * a}x ＋ ${ans}`,
      explanation: `(x + a)² = x² + 2ax + a² より、x² + ${2 * a}x + ${ans} です。`
    };
  }
};

// ==========================================
// 2. 📖 国語（小1〜中3）
// ==========================================
const generateJapanese = (grade: number, uName: string, idSuffix: string): Question => {
  if (grade <= 2 || uName.includes('ひらがな') || uName.includes('かたかな')) {
    const j1DB = [
      { q: '「いぬ」を カタカナで かくと どれかな？', a: 'イヌ', w: ['ネコ', 'トリ', 'サル'] },
      { q: '「ねこ」を カタカナで かくと どれかな？', a: 'ネコ', w: ['イヌ', 'ウマ', 'トリ'] },
      { q: '「とり」を カタカナで かくと どれかな？', a: 'トリ', w: ['サル', 'シカ', 'クマ'] },
      { q: '「おおきい」の はんたいの ことばは どれかな？', a: 'ちいさい', w: ['たかい', 'ひくい', 'あかるい'] },
      { q: '「うえ」の はんたいの ことばは どれかな？', a: 'した', w: ['みぎ', 'ひだり', 'まえ'] },
      { q: '「みぎ」の はんたいの ことばは どれかな？', a: 'ひだり', w: ['うしろ', 'まえ', 'した'] },
      { q: '「あさ」の はんたいの ことばは どれかな？', a: 'よる', w: ['ひる', 'ゆうがた', 'あした'] },
      { q: '「あかるい」の はんたいの ことばは どれかな？', a: 'くらい', w: ['しろい', 'くろい', 'あたたかい'] },
      { q: '「ながい」の はんたいの ことばは どれかな？', a: 'みじかい', w: ['ふとい', 'ほそい', 'ちいさい'] },
      { q: '「たかい」の はんたいの ことばは どれかな？', a: 'ひくい', w: ['おもい', 'かるい', 'みじかい'] },
      { q: 'かん字「日」の よみかたとして ただしいものは どれかな？', a: 'ひ', w: ['つき', 'き', 'みず'] },
      { q: 'かん字「月」の よみかたとして ただしいものは どれかな？', a: 'つき', w: ['ひ', 'き', 'やま'] },
      { q: 'かん字「木」の よみかたとして ただしいものは どれかな？', a: 'き', w: ['もり', 'やま', 'かわ'] },
      { q: 'かん字「山」の よみかたとして ただしいものは どれかな？', a: 'やま', w: ['かわ', 'たに', 'うみ'] },
      { q: 'かん字「川」の よみかたとして ただしいものは どれかな？', a: 'かわ', w: ['やま', 'いけ', 'みず'] },
      { q: '「ともだち [   ] あそぶ」 空らんに入る ただしいことばは？', a: 'と', w: ['を', 'に', 'へ'] },
      { q: '「がっこう [   ] いく」 空らんに入る ただしいことばは？', a: 'へ', w: ['を', 'が', 'は'] },
      { q: '「ごはん [   ] たべる」 空らんに入る ただしいことばは？', a: 'を', w: ['へ', 'に', 'で'] },
      { q: '「はる」の つぎに くる きせつは どれかな？', a: 'なつ', w: ['あき', 'ふゆ', 'お正月'] },
      { q: '「あき」の つぎに くる きせつは どれかな？', a: 'ふゆ', w: ['はる', 'なつ', 'つゆ'] }
    ];
    const item = j1DB[getRandomInt(0, j1DB.length - 1)];
    return {
      id: `dyn-j1-${idSuffix}`,
      subject: 'japanese',
      grade: 1,
      questionText: item.q,
      options: ensureUniqueOptions([item.a, ...item.w], item.a, 'japanese'),
      correctAnswer: item.a,
      explanation: `正解は 「${item.a}」 です。`
    };
  }

  if (grade >= 3 && grade <= 6) {
    const jElemDB = [
      { q: '漢字「休」の部首（へん）は何かな？', a: 'にんべん（イ）', w: ['きへん（木）', 'さんずい（氵）', 'くさかんむり（艹）'] },
      { q: '漢字「海」の部首（へん）は何かな？', a: 'さんずい（氵）', w: ['にんべん（イ）', 'きへん（木）', 'ごんべん（言）'] },
      { q: '漢字「話」の部首（へん）は何かな？', a: 'ごんべん（言）', w: ['さんずい（氵）', 'にんべん（イ）', 'きへん（木）'] },
      { q: '漢字「花」の部首（かんむり）は何かな？', a: 'くさかんむり（艹）', w: ['うかんむり（宀）', 'あめかんむり（雨）', 'たけかんむり（⺮）'] },
      { q: '漢字「道」の部首（にょう）は何かな？', a: 'しんにょう（辶）', w: ['えんにょう（廴）', 'もんがまえ（門）', 'くにがまえ（囗）'] },
      { q: 'ことわざ「犬も歩けば [       ]」 空欄に入る言葉は？', a: '棒に当たる', w: ['猫に会う', '鳥が飛ぶ', '骨がある'] },
      { q: 'ことわざ「猿も木から [       ]」 空欄に入る言葉は？', a: '落ちる', w: ['登る', '滑る', '飛ぶ'] },
      { q: 'ことわざ「石の上にも [       ]」 空欄に入る言葉は？', a: '三年', w: ['十年', '一日', '百日'] },
      { q: 'ことわざ「早起きは [       ]」 空欄に入る言葉は？', a: '三文の徳', w: ['体の毒', '百人力', '福の神'] },
      { q: '慣用句「耳にたこができる」の意味はどれかな？', a: '同じことを何度も聞かされて嫌になること', w: ['耳が痛くなること', 'たこ焼きを食べること', 'よく聞こえること'] },
      { q: '慣用句「頭が上がらない」の意味はどれかな？', a: '相手に対して引け目を感じていること', w: ['頭が重いこと', '眠いこと', 'お辞儀をすること'] },
      { q: '慣用句「手を打つ」の意味はどれかな？', a: '必要な対策を立てること', w: ['拍手をすること', '相手を叩くこと', '手を洗うこと'] },
      { q: '四字熟語「十人十色」の意味として正しいものは？', a: '人それぞれ考えや好みが違うこと', w: ['十色の絵の具があること', '十人が仲良くすること', '派手な服装のこと'] },
      { q: '四字熟語「一石二鳥」の意味として正しいものは？', a: '一つの行動で二つの利益を得ること', w: ['二羽の鳥を捕まえること', '石を二つ投げること', '鳥が石を運ぶこと'] },
      { q: '四字熟語「以心伝心」の意味として正しいものは？', a: '言葉にしなくても互いに心が通じ合うこと', w: ['手紙で伝えること', '電話で話すこと', '秘密を守ること'] },
      { q: '漢字「森」の部首は何かな？', a: 'き（木）', w: ['ひ（日）', 'やま（山）', 'ひと（人）'] },
      { q: '漢字「校」の部首は何かな？', a: 'きへん（木）', w: ['ごんべん（言）', 'へん（片）', 'さんずい（氵）'] },
      { q: '漢字「語」の部首は何かな？', a: 'ごんべん（言）', w: ['にんべん（イ）', 'くち（口）', 'きへん（木）'] }
    ];
    const item = jElemDB[getRandomInt(0, jElemDB.length - 1)];
    return {
      id: `dyn-j-elem-${idSuffix}`,
      subject: 'japanese',
      grade,
      questionText: item.q,
      options: ensureUniqueOptions([item.a, ...item.w], item.a, 'japanese'),
      correctAnswer: item.a,
      explanation: `正解は 「${item.a}」 です。`
    };
  }

  // 中学生（grade 7〜9）: 文法、品詞、古文、漢文、四字熟語
  const jJhsDB = [
    { q: '「油断大敵」の意味として正しいものはどれかな？', a: '気を許すと大変な失敗をするということ', w: ['油を大量に使うこと', '敵と仲良くすること', '大声を出すこと'] },
    { q: '「温故知新」の読み方はどれかな？', a: 'おんこちしん', w: ['おんこちちん', 'おんふるちしん', 'ぬくもりちしん'] },
    { q: '自立語で活用があり、単独で述語になることができる品詞（動詞・形容詞・形容動詞）の総称は？', a: '用言', w: ['体言', '助詞', '助動詞'] },
    { q: '自立語で活用がなく、主語になることができる品詞（名詞）の総称は？', a: '体言', w: ['用言', '副詞', '接続詞'] },
    { q: '「美しく咲く」の「美しく」の品詞は何かな？', a: '形容詞（連用形）', w: ['動詞', '形容動詞', '副詞'] },
    { q: '「静かに話す」の「静かに」の品詞は何かな？', a: '形容動詞（連用形）', w: ['副詞', '動詞', '形容詞'] },
    { q: '古文「いまは昔、竹取の翁といふものありけり」の冒頭で有名な作品は？', a: '竹取物語', w: ['源氏物語', '平家物語', '伊勢物語'] },
    { q: '漢文の返り点「レ点」の読み方の規則はどれかな？', a: '下の字から上の字へ返って読む', w: ['上の字から下の字へ読む', '一文字飛ばして読む', '読まずに飛ばす'] },
    { q: '漢文の返り点「一二点」において、先に読むのはどちらかな？', a: '「一」がついている字', w: ['「二」がついている字', 'どちらでもよい', '文頭の字'] },
    { q: '故事成語「矛盾」の由来となった武器の組み合わせは？', a: 'どんな盾も突き通す矛と、どんな矛も防ぐ盾', w: ['弓と矢', '刀と鎧', '鉄砲と兜'] },
    { q: '故事成語「蛇足」の意味として正しいものはどれかな？', a: '余計な付け足しをして、かえって台無しにすること', w: ['足が速いこと', '蛇を捕まえること', '足が長いこと'] },
    { q: '動詞「走る」の活用形のうち、「走れば」の「走れ」は何形かな？', a: '仮定形', w: ['未然形', '連用形', '連体形'] },
    { q: '動詞「書く」の活用形のうち、「書かない」の「書か」は何形かな？', a: '未然形', w: ['連用形', '終止形', '命令形'] },
    { q: '「祇園精舎の鐘の声、諸行無常の響きあり」で始まる軍記物語は？', a: '平家物語', w: ['太平記', '保元物語', '平治物語'] },
    { q: '松尾芭蕉が東北や北陸を旅して著した紀行文はどれかな？', a: 'おくのほそ道', w: ['土佐日記', '更級日記', '東海道中膝栗毛'] },
    { q: '四字熟語「臥薪嘗胆」の意味として正しいものは？', a: '将来の成功のために苦難に耐え忍ぶこと', w: ['美味しい料理を味わうこと', 'ぐっすり眠ること', '薪を集めること'] }
  ];
  const item = jJhsDB[getRandomInt(0, jJhsDB.length - 1)];
  return {
    id: `dyn-j-jhs-${idSuffix}`,
    subject: 'japanese',
    grade,
    questionText: item.q,
    options: ensureUniqueOptions([item.a, ...item.w], item.a, 'japanese'),
    correctAnswer: item.a,
    explanation: `正解は 「${item.a}」 です。`
  };
};

// ==========================================
// 3. 🧪 理科（小1〜中3）
// ==========================================
const generateScience = (grade: number, uName: string, idSuffix: string): Question => {
  // 小学生向け（grade 1〜6）
  if (grade <= 6 && !uName.includes('オーム') && !uName.includes('化学') && !uName.includes('イオン')) {
    const scElemDB = [
      { q: '昆虫（チョウやカブトムシなど）の足は全部で何本あるかな？', a: '6本', w: ['4本', '8本', '10本'] },
      { q: '昆虫の体は「あたま」「むね」と、あと一つの部分はどこかな？', a: 'はら（腹）', w: ['あし', 'せなか', 'しっぽ'] },
      { q: '植物の種が発芽するために必要な「3つの条件」は水・空気とあと一つは何かな？', a: '適した温度', w: ['日光', '肥料', '土'] },
      { q: '太陽の光が当たっているとき、影ができる向きは太陽とどうなっているかな？', a: '太陽と反対の向き', w: ['太陽と同じ向き', '真上', '真下'] },
      { q: '植物が日光を受けて二酸化炭素と水からデンプンをつくる働きを何というか？', a: '光合成', w: ['呼吸', '蒸散', '吸水'] },
      { q: '水溶液の性質を調べるとき、酸性を確かめるリトマス紙の変化は？', a: '青色リトマス紙が赤色に変わる', w: ['赤色が青色に変わる', '黄色に変わる', '透明になる'] },
      { q: 'ものの溶け方で、水に食塩をこれ以上溶けない限界まで溶かした水溶液を何というか？', a: '飽和水溶液', w: ['希薄水溶液', '炭酸水', '純水'] },
      { q: '人の体で、食べたものの栄養を主に吸収する器官はどこかな？', a: '小腸', w: ['胃', '大腸', '食道'] },
      { q: '人の体で、空気中の酸素を取り入れて二酸化炭素を出す器官は？', a: '肺', w: ['心臓', '肝臓', '腎臓'] },
      { q: '磁石の同じ極同士（N極とN極、S極とS極）を近づけるとどうなるかな？', a: 'しりぞけ合う（反発する）', w: ['引きつけ合う', 'くっつく', 'なにも起きない'] },
      { q: 'チョウの育ち方で「たまご → ようちゅう → [   ] → 成虫」に入るのは？', a: 'さなぎ', w: ['まゆ', 'おたまじゃくし', 'みずすまし'] },
      { q: '水が沸騰して湯気や水蒸気になる現象は何かな？', a: '蒸発（沸騰）', w: ['凝固', '融解', '光合成'] },
      { q: '朝顔（アサガオ）の花が咲く時間帯はいつごろかな？', a: '朝', w: ['昼', '夕方', '夜'] },
      { q: 'てこの原理で、力を加える位置のことを何というか？', a: '力点', w: ['支点', '作用点', '重心'] }
    ];
    const item = scElemDB[getRandomInt(0, scElemDB.length - 1)];
    return {
      id: `dyn-sc-elem-${idSuffix}`,
      subject: 'science',
      grade,
      questionText: item.q,
      options: ensureUniqueOptions([item.a, ...item.w], item.a, 'science'),
      correctAnswer: item.a,
      explanation: `正解は 「${item.a}」 です。`
    };
  }

  // 中2: オームの法則
  if (uName.includes('オーム') || uName.includes('回路') || uName.includes('電流')) {
    const v = getRandomInt(2, 12);
    const r = getRandomInt(2, 6) * 5;
    const i = (v / r).toFixed(2);
    const opts = shuffle([`${i} A`, `${(v * r).toFixed(0)} A`, `${(v + r).toFixed(0)} A`, `${(r / v).toFixed(1)} A`]);
    return {
      id: `dyn-ohm-${idSuffix}`,
      subject: 'science',
      grade: 8,
      questionText: `オームの法則：電圧 ${v}V、抵抗 ${r}Ω の回路に流れる電流 I の大きさは？ (I = V / R)`,
      options: ensureUniqueOptions(opts, `${i} A`, 'science'),
      correctAnswer: `${i} A`,
      explanation: `オームの法則 I = V / R より、${v}V ÷ ${r}Ω = ${i}A です。`
    };
  }

  // 中学生向け（分野別）
  const scJhsDB = [
    { q: '地震で最初に届く、伝わる速度が速い縦波を何というか？', a: 'P波', w: ['S波', '表面波', 'T波'] },
    { q: '地震の揺れにおいて、P波の後に届く大きな横波を何というか？', a: 'S波', w: ['P波', 'L波', '海溝波'] },
    { q: '酸性とアルカリ性が反応して水と塩ができる反応を何というか？', a: '中和反応', w: ['酸化', '還元', '電解'] },
    { q: '細胞分裂のうち、卵や精子などの生殖細胞を作るときに行われる特別な分裂は？', a: '減数分裂', w: ['体細胞分裂', '出芽', '受精'] },
    { q: '物質が酸素と化合して別の物質になる化学変化を何というか？', a: '酸化', w: ['還元', '中和', '分解'] },
    { q: '酸化物が酸素を奪われる化学変化を何というか？', a: '還元', w: ['酸化', '中和', '電離'] },
    { q: '水に溶けて陽イオンと陰イオンに分かれる物質を何というか？', a: '電解質', w: ['非電解質', '混合物', '単体'] },
    { q: '凸レンズの焦点距離の2倍の位置に物体を置いたとき、できる実像の大きさは？', a: '物体と同じ大きさ', w: ['物体より大きい', '物体より小さい', '像はできない'] },
    { q: '物体に1Nの力を加えて、その力の向きに1m動かしたときの仕事の量は？', a: '1 J（ジュール）', w: ['1 W（ワット）', '1 N', '1 Pa'] },
    { q: '被子植物において、受粉後に成長して種子になる部分はどこかな？', a: '胚珠', w: ['子房', '花粉', 'がく'] },
    { q: '被子植物において、受粉後に成長して果実になる部分はどこかな？', a: '子房', w: ['胚珠', '花粉', '柱頭'] },
    { q: 'だ液に含まれ、デンプンを麦芽糖に分解する消化酵素は何かな？', a: 'アミラーゼ', w: ['ペプシン', 'リパーゼ', 'トリプシン'] },
    { q: '大気圧の大きさの標準（1気圧）はおよそ何ヘクトパスカル（hPa）かな？', a: '約1013 hPa', w: ['約100 hPa', '約500 hPa', '約2000 hPa'] },
    { q: '塩化銅水溶液を電気分解したとき、陰極に付着する赤褐色の物質は何？', a: '銅', w: ['塩素', '水素', '酸素'] },
    { q: 'メンデルがエンドウ豆の実験で発見した、対になる遺伝子が分かれて配偶子に入る法則は？', a: '分離の法則', w: ['優性の法則', '独立の法則', '保存の法則'] }
  ];
  const item = scJhsDB[getRandomInt(0, scJhsDB.length - 1)];
  return {
    id: `dyn-sc-jhs-${idSuffix}`,
    subject: 'science',
    grade: grade || 8,
    questionText: item.q,
    options: ensureUniqueOptions([item.a, ...item.w], item.a, 'science'),
    correctAnswer: item.a,
    explanation: `正解は 「${item.a}」 です。`
  };
};

// ==========================================
// 4. 🗺 社会（小1〜中3）
// ==========================================
const generateSocial = (grade: number, uName: string, idSuffix: string): Question => {
  // 小3〜小4向け（地図記号、方位、地域生活）
  if (grade <= 4 || uName.includes('地図記号') || uName.includes('まちの様子')) {
    const soElemDB = [
      { q: '地図記号で「◎（二重丸）」は何を表しているかな？', a: '市役所', w: ['警察署', '郵便局', '小学校'] },
      { q: '地図記号で「文」は何を表しているかな？', a: '小・中学校', w: ['市役所', '図書館', '病院'] },
      { q: '地図記号で「〒（テ）」は何を表しているかな？', a: '郵便局', w: ['交番', '消防署', '神社'] },
      { q: '地図記号で「×（バツ）」は何を表しているかな？', a: '警察署・交番', w: ['消防署', '市役所', '病院'] },
      { q: '地図記号で「鳥居の形（⛩）」は何を表しているかな？', a: '神社', w: ['寺院', '城跡', '博物館'] },
      { q: '地図記号で「卍（まんじ）」は何を表しているかな？', a: '寺院（お寺）', w: ['神社', '教会', '病院'] },
      { q: '地図記号で「Yの字の形」は何を表しているかな？', a: '消防署', w: ['警察署', '郵便局', '発電所'] },
      { q: '地図記号で「円の中に十字」は何を表しているかな？', a: '病院', w: ['赤十字', '交番', '学校'] },
      { q: '地図で上側（北）を向いたとき、右手側の方角はどれかな？', a: '東', w: ['西', '南', '北東'] },
      { q: '地図で上側（北）を向いたとき、左手側の方角はどれかな？', a: '西', w: ['東', '南', '北西'] },
      { q: '火事を消したり人命救助を行う消防署の緊急電話番号は？', a: '119番', w: ['110番', '118番', '104番'] },
      { q: '事件や事故のときに警察へ通報する電話番号は？', a: '110番', w: ['119番', '118番', '117番'] },
      { q: '海の上で事故や事件が起きたときに海上保安庁へ通報する番号は？', a: '118番', w: ['110番', '119番', '117番'] }
    ];
    const item = soElemDB[getRandomInt(0, soElemDB.length - 1)];
    return {
      id: `dyn-so-elem-${idSuffix}`,
      subject: 'social',
      grade,
      questionText: item.q,
      options: ensureUniqueOptions([item.a, ...item.w], item.a, 'social'),
      correctAnswer: item.a,
      explanation: `正解は 「${item.a}」 です。`
    };
  }

  // 小5〜小6向け（農業・工業、歴史人物）
  if (grade <= 6) {
    const soUpperElemDB = [
      { q: '日本で米づくりの生産量がもっとも多い地方はどこかな？', a: '東北地方', w: ['四国地方', '九州地方', '近畿地方'] },
      { q: '日本の太平洋側に広がる工業が盛んな帯状の地域を何というか？', a: '太平洋ベルト', w: ['日本海ベルト', '瀬戸内ベルト', '中部ライン'] },
      { q: '十七条の憲法を制定し、法隆寺を建てたとされる人物は？', a: '聖徳太子', w: ['卑弥呼', '中大兄皇子', '徳川家康'] },
      { q: '江戸幕府を開き、260年以上続く平和な時代を作った人物は？', a: '徳川家康', w: ['織田信長', '豊臣秀吉', '源頼朝'] },
      { q: '鎌倉幕府を開き、征夷大将軍となった人物はだれかな？', a: '源頼朝', w: ['平清盛', '足利尊氏', '徳川家康'] },
      { q: '天下統一を目前に本能寺の変で倒れた戦国武将はだれかな？', a: '織田信長', w: ['豊臣秀吉', '武田信玄', '上杉謙信'] },
      { q: '太閤検地や刀狩りを行い、全国を統一した戦国大名は？', a: '豊臣秀吉', w: ['織田信長', '徳川家康', '明智光秀'] },
      { q: '邪馬台国の女王で、中国の魏に使者を送ったとされる人物は？', a: '卑弥呼', w: ['推古天皇', '持統天皇', '紫式部'] },
      { q: '源氏物語の作者である平安時代の女性作家はだれかな？', a: '紫式部', w: ['清少納言', '与謝野晶子', '樋口一葉'] },
      { q: '枕草子の作者である平安時代の女性作家はだれかな？', a: '清少納言', w: ['紫式部', '小野小町', '菅原孝標女'] }
    ];
    const item = soUpperElemDB[getRandomInt(0, soUpperElemDB.length - 1)];
    return {
      id: `dyn-so-mid-${idSuffix}`,
      subject: 'social',
      grade,
      questionText: item.q,
      options: ensureUniqueOptions([item.a, ...item.w], item.a, 'social'),
      correctAnswer: item.a,
      explanation: `正解は 「${item.a}」 です。`
    };
  }

  // 中1地理（時差計算）
  if (uName.includes('時差') || uName.includes('経度')) {
    const lonDiff = getRandomInt(1, 11) * 15;
    const hours = lonDiff / 15;
    const opts = shuffle([`${hours}時間`, `${hours + 2}時間`, `${Math.max(1, hours - 1)}時間`, `${lonDiff}時間`]);
    return {
      id: `dyn-tz-${idSuffix}`,
      subject: 'social',
      grade: 7,
      questionText: `時差計算：2つの都市の経度差が ${lonDiff}° あるとき、時差は何時間になるかな？ (15° = 1時間)`,
      options: ensureUniqueOptions(opts, `${hours}時間`, 'social'),
      correctAnswer: `${hours}時間`,
      explanation: `地球は15度で1時間の時差が生じるため、${lonDiff}° ÷ 15 = ${hours}時間 です。`
    };
  }

  // 中学生向け（歴史・地理・公民）
  const soJhsDB = [
    { q: '日本国憲法の三大原則のうち、「国の政治の決定権は国民にある」という原則は？', a: '国民主権', w: ['基本的人権の尊重', '平和主義', '三権分立'] },
    { q: '日本国憲法第9条で放棄されているものはどれかな？', a: '戦争の放棄と戦力の不保持', w: ['表現の自由', '選挙権', '納税の義務'] },
    { q: '三権分立において、法律を制定する「立法権」を持つ機関はどこかな？', a: '国会', w: ['内閣', '裁判所', '日本銀行'] },
    { q: '三権分立において、行政権を持ち国会に対して連帯して責任を負う機関は？', a: '内閣', w: ['国会', '裁判所', '検察庁'] },
    { q: '三権分立において、憲法判断や裁判を行う「司法権」を持つ機関は？', a: '裁判所', w: ['国会', '内閣', '法務省'] },
    { q: '大化の改新（645年）を中心となって進めた人物はだれかな？', a: '中大兄皇子・中臣鎌足', w: ['聖徳太子', '源頼朝', '織田信長'] },
    { q: '710年に奈良に造営された都の名前は何かな？', a: '平城京', w: ['平安京', '藤原京', '難波京'] },
    { q: '794年に京都に造営され、以後約千年間都となった地は？', a: '平安京', w: ['平城京', '鎌倉', '江戸'] },
    { q: '1867年に江戸幕府第15代将軍の徳川慶喜が政権を朝廷に返上した出来事は？', a: '大政奉還', w: ['王政復古の大号令', '明治維新', '廃藩置県'] },
    { q: '日本の標準時子午線（東経135度）が通る兵庫県の都市はどこかな？', a: '明石市', w: ['神戸市', '姫路市', '西宮市'] },
    { q: '日本銀行が行う、国債などを売買して市場の資金量を調整する政策は？', a: '公開市場操作', w: ['預金準備率操作', '為替介入', '増税政策'] },
    { q: '市場経済において、価格が上がると買いたい量（需要）はどうなるかな？', a: '減少する', w: ['増加する', '変わらない', '2倍になる'] },
    { q: '国際連合の本部があるアメリカの都市はどこかな？', a: 'ニューヨーク', w: ['ワシントンD.C.', 'ジュネーブ', 'ロンドン'] }
  ];
  const item = soJhsDB[getRandomInt(0, soJhsDB.length - 1)];
  return {
    id: `dyn-so-jhs-${idSuffix}`,
    subject: 'social',
    grade: grade || 9,
    questionText: item.q,
    options: ensureUniqueOptions([item.a, ...item.w], item.a, 'social'),
    correctAnswer: item.a,
    explanation: `正解は 「${item.a}」 です。`
  };
};

// ==========================================
// 5. 🔤 英語（小1〜中3）
// ==========================================
const generateEnglish = (grade: number, uName: string, idSuffix: string): Question => {
  // 小学生向け（grade 1〜6）
  if (grade <= 6 && !uName.includes('関係代名詞') && !uName.includes('現在完了')) {
    const elemVocab = [
      { en: 'apple', jp: 'リンゴ', w: ['バナナ', 'みかん', 'ぶどう'] },
      { en: 'dog', jp: '犬', w: ['猫', '鳥', 'うさぎ'] },
      { en: 'cat', jp: '猫', w: ['犬', 'ライオン', '馬'] },
      { en: 'book', jp: '本', w: ['ノート', 'ペン', 'つくえ'] },
      { en: 'desk', jp: '机（つくえ）', w: ['いす', '本だな', 'ドア'] },
      { en: 'chair', jp: 'いす', w: ['つくえ', 'ベッド', '窓'] },
      { en: 'school', jp: '学校', w: ['家', '公園', '病院'] },
      { en: 'teacher', jp: '先生', w: ['生徒', '医者', '警察官'] },
      { en: 'student', jp: '生徒', w: ['先生', '家族', '友達'] },
      { en: 'friend', jp: '友達', w: ['敵', '先生', '赤ちゃん'] },
      { en: 'red', jp: '赤（あか）', w: ['青', '黄色', '緑'] },
      { en: 'blue', jp: '青（あお）', w: ['赤', '白', '黒'] },
      { en: 'yellow', jp: '黄色（きいろ）', w: ['緑', '紫', 'オレンジ'] },
      { en: 'green', jp: '緑（みどり）', w: ['青', '茶色', '灰色'] },
      { en: 'Sunday', jp: '日曜日', w: ['月曜日', '土曜日', '金曜日'] },
      { en: 'Monday', jp: '月曜日', w: ['火曜日', '水曜日', '日曜日'] }
    ];
    const target = elemVocab[getRandomInt(0, elemVocab.length - 1)];
    return {
      id: `dyn-en-elem-${idSuffix}`,
      subject: 'english',
      grade: grade || 5,
      questionText: `英単語 「${target.en}」 の意味はどれかな？`,
      options: ensureUniqueOptions([target.jp, ...target.w], target.jp, 'english'),
      correctAnswer: target.jp,
      explanation: `「${target.en}」 は日本語で 「${target.jp}」 です。`
    };
  }

  // 中3: 関係代名詞・分詞修飾
  if (uName.includes('関係代名詞') || uName.includes('分詞の後置修飾')) {
    const relItems = [
      { q: '「The boy [       ] lives in Tokyo is my friend.」 空欄に入る関係代名詞（人・主格）は？', a: 'who', w: ['which', 'where', 'whose'] },
      { q: '「This is the book [       ] I bought yesterday.」 空欄に入る関係代名詞（物・目的格）は？', a: 'which', w: ['who', 'where', 'what'] },
      { q: '「I have a friend [       ] father is a doctor.」 空欄に入る関係代名詞（所有格）は？', a: 'whose', w: ['who', 'which', 'whom'] },
      { q: '「This is the girl [       ] won the prize.」 空欄に入る関係代名詞（人・主格）は？', a: 'who', w: ['which', 'when', 'whose'] },
      { q: '「The car [       ] is running fast is red.」 空欄に入る関係代名詞（物・主格）は？', a: 'which', w: ['who', 'where', 'whom'] },
      { q: '「I know the boy [       ] loves cats.」 空欄に入る関係代名詞（人・主格）は？', a: 'who', w: ['which', 'whose', 'where'] },
      { q: '「The girl [       ] tennis is my sister.」 （関係代名詞・分詞修飾：テニスをしている少女）空欄に入るのは？', a: 'playing', w: ['played', 'plays', 'play'] },
      { q: '「This is a song [       ] by Ken.」 （関係代名詞・分詞修飾：ケンによって歌われた歌）空欄に入るのは？', a: 'sung', w: ['singing', 'sang', 'sings'] },
      { q: '「The letter [       ] in English was easy to read.」 （関係代名詞・分詞修飾：英語で書かれた手紙）空欄に入るのは？', a: 'written', w: ['writing', 'wrote', 'writes'] },
      { q: '「Look at the dog [       ] under the tree.」 （関係代名詞・分詞修飾：木の下で走っている犬）空欄に入るのは？', a: 'running', w: ['ran', 'run', 'runs'] }
    ];
    const target = relItems[getRandomInt(0, relItems.length - 1)];
    return {
      id: `dyn-rel-pronoun-${idSuffix}`,
      subject: 'english',
      grade: 9,
      questionText: target.q,
      options: ensureUniqueOptions([target.a, ...target.w], target.a, 'english'),
      correctAnswer: target.a,
      explanation: `正解は 「${target.a}」 です。`
    };
  }

  // 中3: 現在完了
  if (uName.includes('現在完了')) {
    const verbs = [
      { orig: 'live', p: 'lived', jp: '住んでいます' },
      { orig: 'study', p: 'studied', jp: '勉強しています' },
      { orig: 'know', p: 'known', jp: '知っています' },
      { orig: 'play', p: 'played', jp: 'テニスをしています' },
      { orig: 'teach', p: 'taught', jp: '教えています' },
      { orig: 'work', p: 'worked', jp: '働いています' }
    ];
    const v = verbs[getRandomInt(0, verbs.length - 1)];
    const years = getRandomInt(2, 7);
    const ans = `I have ${v.p} English for ${years} years.`;
    const opts = shuffle([
      ans,
      `I ${v.orig} English for ${years} years.`,
      `I am ${v.orig}ing English ${years} years.`,
      `I was ${v.p} English since ${years} years.`
    ]);
    return {
      id: `dyn-en-perf-${idSuffix}`,
      subject: 'english',
      grade: 9,
      questionText: `「私は${years}年間、英語を${v.jp}（現在完了・継続）」の正しい英文はどれかな？`,
      options: ensureUniqueOptions(opts, ans, 'english'),
      correctAnswer: ans,
      explanation: `過去から現在までの継続を表すには [have + 過去分詞 + for 時間] を使います。`
    };
  }

  // 中学生向け標準（文法・語彙）
  const jhsVocab = [
    { q: '「彼は毎日テニスをします。」He [      ] tennis every day. 空欄に入るのは？', a: 'plays', w: ['play', 'playing', 'is play'] },
    { q: '「私は昨日、京都へ行きました。」I [      ] to Kyoto yesterday. 空欄に入るのは？', a: 'went', w: ['go', 'goes', 'going'] },
    { q: '「明日は晴れるでしょう（未来）。」It [      ] be sunny tomorrow. 空欄に入るのは？', a: 'will', w: ['was', 'did', 'is to'] },
    { q: '「彼女は親切な先生です。」She [      ] a kind teacher. 空欄に入るbe動詞は？', a: 'is', w: ['are', 'am', 'be'] },
    { q: '「彼らは公園で走っています（現在進行形）。」They [      ] in the park. 空欄に入るのは？', a: 'are running', w: ['is running', 'running', 'ran'] },
    { q: '「私は英語を勉強するために図書館へ行きました（不定詞）。」I went to the library [      ] English.', a: 'to study', w: ['studying', 'studied', 'study'] },
    { q: '「この部屋は毎日掃除されます（受動態）。」This room [      ] every day.', a: 'is cleaned', w: ['cleaned', 'cleaning', 'cleans'] },
    { q: '英単語 「difficult」 の意味はどれかな？', a: '難しい', w: ['簡単な', '面白い', '大切な'] },
    { q: '英単語 「important」 の意味はどれかな？', a: '重要な', w: ['退屈な', '危険な', '静かな'] },
    { q: '英単語 「popular」 の意味はどれかな？', a: '人気のある', w: ['珍しい', '高価な', '静かな'] },
    { q: '英単語 「experience」 の意味はどれかな？', a: '経験', w: ['実験', '危険', '希望'] },
    { q: '英単語 「environment」 の意味はどれかな？', a: '環境', w: ['社会', '経済', '自然'] }
  ];
  const item = jhsVocab[getRandomInt(0, jhsVocab.length - 1)];
  return {
    id: `dyn-en-jhs-${idSuffix}`,
    subject: 'english',
    grade: grade || 8,
    questionText: item.q,
    options: ensureUniqueOptions([item.a, ...item.w], item.a, 'english'),
    correctAnswer: item.a,
    explanation: `正解は 「${item.a}」 です。`
  };
};

// 🌟 選択された教科・学年・単元名に応じた高機能動的問題生成エンジン
export const generateDynamicQuestion = (subject: Subject, grade: number, unitName?: string): Question => {
  const idSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const uName = unitName || '';

  let rawQuestion: Question;
  switch (subject) {
    case 'math':
      rawQuestion = generateMath(grade, uName, idSuffix);
      break;
    case 'japanese':
      rawQuestion = generateJapanese(grade, uName, idSuffix);
      break;
    case 'science':
      rawQuestion = generateScience(grade, uName, idSuffix);
      break;
    case 'social':
      rawQuestion = generateSocial(grade, uName, idSuffix);
      break;
    case 'english':
      rawQuestion = generateEnglish(grade, uName, idSuffix);
      break;
    default:
      rawQuestion = generateMath(grade, uName, idSuffix);
  }

  return {
    ...rawQuestion,
    options: ensureUniqueOptions(rawQuestion.options, rawQuestion.correctAnswer, subject)
  };
};
