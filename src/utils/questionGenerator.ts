import type { Question, Subject } from '../types';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffle = <T>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// 🌟 選択肢がすべてユニーク（重複なし）であることを強制・保証する安全関数
const ensureUniqueOptions = (options: string[], correctAnswer: string, subject: Subject): string[] => {
  const uniqueSet = new Set<string>();
  // 正解を必ず一番に入れる
  uniqueSet.add(correctAnswer);
  options.forEach(opt => uniqueSet.add(opt));

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

// 内部用の動的問題生成関数
const generateRawQuestion = (subject: Subject, grade: number, unitName?: string): Question => {
  const timestamp = Date.now() + Math.floor(Math.random() * 100000);
  const uName = unitName || '';

  // ==========================================
  // 1. 🧮 算数・数学 (一次関数、連立方程式、三平方、図形、確率、計算)
  // ==========================================
  if (subject === 'math') {
    // 【中2】一次関数 (y=ax+b)
    if (uName.includes('一次関数') || uName.includes('傾き') || uName.includes('変化の割合')) {
      const a = getRandomInt(-4, 5);
      if (a === 0) return generateDynamicQuestion('math', grade, '一次関数');
      const b = getRandomInt(-6, 8);
      const bStr = b >= 0 ? `＋ ${b}` : `- ${Math.abs(b)}`;
      const rawOptions = [`変化の割合: ${a}`, `変化の割合: ${b}`, `変化の割合: ${a + 1}`, `変化の割合: ${-a}`];
      return {
        id: `dyn-func1-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `一次関数 「y = ${a}x ${bStr}」 の変化の割合（傾き）を求めなさい。`,
        options: ensureUniqueOptions(rawOptions, `変化の割合: ${a}`, 'math'),
        correctAnswer: `変化の割合: ${a}`,
        explanation: `y = ax + b において、変化の割合（傾き）は x の係数 a であるため、${a} です。`
      };
    }

    // 【中2】連立方程式
    if (uName.includes('連立方程式') || uName.includes('連立')) {
      const xVal = getRandomInt(1, 5);
      const yVal = getRandomInt(1, 5);
      const c1 = xVal + yVal;
      const c2 = 2 * xVal + yVal;
      const rawOptions = [
        `x = ${xVal}, y = ${yVal}`,
        `x = ${xVal + 1}, y = ${yVal + 2}`,
        `x = ${xVal + 2}, y = ${yVal + 1}`,
        `x = ${yVal + 3}, y = ${xVal}`
      ];
      return {
        id: `dyn-sys-eq-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `連立方程式 「x ＋ y = ${c1} ,  2x ＋ y = ${c2}」 を解きなさい。`,
        options: ensureUniqueOptions(rawOptions, `x = ${xVal}, y = ${yVal}`, 'math'),
        correctAnswer: `x = ${xVal}, y = ${yVal}`,
        explanation: `下の式から上の式を引くと x = ${c2 - c1} = ${xVal}。よって y = ${yVal} です。`
      };
    }

    // 【中3】関数 y=ax²
    if (uName.includes('y=ax²') || uName.includes('関数') || uName.includes('放物線')) {
      const a = getRandomInt(1, 4);
      const x = getRandomInt(2, 5);
      const y = a * x * x;
      const options = shuffle([`y = ${y}`, `y = ${y + 2}`, `y = ${y - 3}`, `y = ${a * x}`]);
      return {
        id: `dyn-quad-func-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `関数 y = ${a}x² について、x = ${x} のときの y の値を求めなさい。`,
        options,
        correctAnswer: `y = ${y}`,
        explanation: `y = ${a} × (${x})² = ${a} × ${x * x} = ${y} です。`
      };
    }

    // 【中3】相似な図形・円周角の定理
    if (uName.includes('相似') || uName.includes('円周角')) {
      const centralAngle = getRandomInt(4, 14) * 10;
      const inscribedAngle = centralAngle / 2;
      const options = shuffle([`${inscribedAngle}°`, `${centralAngle}°`, `${inscribedAngle + 10}°`, `${centralAngle * 2}°`]);
      return {
        id: `dyn-circle-angle-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `同じ弧に対する中心角が ${centralAngle}° のとき、円周角の大きさを求めなさい。`,
        options,
        correctAnswer: `${inscribedAngle}°`,
        explanation: `円周角の定理より、円周角は中心角の半分の大きさになるので ${centralAngle}° ÷ 2 = ${inscribedAngle}° です。`
      };
    }

    // 【中3】三平方の定理
    if (uName.includes('三平方') || uName.includes('ピタゴラス')) {
      const k = getRandomInt(1, 3);
      const a = 3 * k;
      const b = 4 * k;
      const c = 5 * k;
      const options = shuffle([`${c}cm`, `${c + 2}cm`, `${a + b}cm`, `${c - 1}cm`]);
      return {
        id: `dyn-pytha-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `直角をはさむ2辺が ${a}cm, ${b}cm の直角三角形の斜辺の長さを求めなさい。`,
        options,
        correctAnswer: `${c}cm`,
        explanation: `a² + b² = c² より、${a}² + ${b}² = ${a * a + b * b} = ${c}²。斜辺は ${c}cm です。`
      };
    }

    // 【中3/中2】因数分解・多項式
    if (uName.includes('因数分解') || uName.includes('多項式') || uName.includes('展開')) {
      const a = getRandomInt(2, 9);
      const aSq = a * a;
      const options = shuffle([`(x ＋ ${a})(x - ${a})`, `(x - ${a})²`, `(x ＋ ${a})²`, `x(x - ${aSq})`]);
      return {
        id: `dyn-factor-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `「x² - ${aSq}」 を因数分解しなさい。`,
        options,
        correctAnswer: `(x ＋ ${a})(x - ${a})`,
        explanation: `公式 a² - b² = (a + b)(a - b) より、(x + ${a})(x - ${a}) です。`
      };
    }

    // 【中3】平方根
    if (uName.includes('平方根') || uName.includes('√')) {
      const a = getRandomInt(2, 5);
      const b = getRandomInt(2, 5);
      const product = a * a * b;
      const options = shuffle([`${a}√${b}`, `${b}√${a}`, `${a * b}`, `√${a + b}`]);
      return {
        id: `dyn-sqrt-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `√${product} を a√b の形にしなさい。`,
        options,
        correctAnswer: `${a}√${b}`,
        explanation: `√${product} = √(${a}² × ${b}) = ${a}√${b} です。`
      };
    }

    // 【中3】二次方程式
    if (uName.includes('二次方程式')) {
      const p = getRandomInt(1, 5);
      const q = getRandomInt(6, 9);
      const b = -(p + q);
      const c = p * q;
      const bSign = b >= 0 ? `＋ ${b}` : `- ${Math.abs(b)}`;
      const options = shuffle([`x = ${p}, ${q}`, `x = ${-p}, ${-q}`, `x = ${p}, ${-q}`, `x = ${-p}, ${q}`]);
      return {
        id: `dyn-quad-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `二次方程式 「x² ${bSign}x ＋ ${c} = 0」 を解きなさい。`,
        options,
        correctAnswer: `x = ${p}, ${q}`,
        explanation: `(x - ${p})(x - ${q}) = 0 と因数分解できるので、x = ${p}, ${q} です。`
      };
    }

    // 学年別デフォルト問題
    if (grade >= 7) {
      if (grade === 9) {
        const a = getRandomInt(2, 7);
        const ans = a * a;
        const options = shuffle([`x² ＋ ${2 * a}x ＋ ${ans}`, `x² ＋ ${ans}`, `x² ＋ ${a}x ＋ ${ans}`, `x² - ${ans}`]);
        return {
          id: `dyn-m9-def-${timestamp}`,
          subject: 'math',
          grade,
          questionText: `(x ＋ ${a})² を展開しなさい。`,
          options,
          correctAnswer: `x² ＋ ${2 * a}x ＋ ${ans}`,
          explanation: `(x + a)² = x² + 2ax + a² より、x² + ${2 * a}x + ${ans} です。`
        };
      }

      const a = getRandomInt(-9, -2);
      const b = getRandomInt(3, 9);
      const ans = a + b;
      const options = shuffle([String(ans), String(ans - 2), String(-ans), String(ans + 3)]);
      return {
        id: `dyn-m7-def-${timestamp}`,
        subject: 'math',
        grade,
        questionText: `正の数・負の数の計算：「(${a}) ＋ ${b}」 の答えはどれかな？`,
        options,
        correctAnswer: String(ans),
        explanation: `(${a}) ＋ ${b} = ${ans} です。`
      };
    }

    const a = getRandomInt(3, 9);
    const b = getRandomInt(2, 9);
    const ans = a * b;
    const options = shuffle([String(ans), String(ans + b), String(ans - 2), String(ans + 3)]);
    return {
      id: `dyn-math-${timestamp}`,
      subject: 'math',
      grade,
      questionText: `計算問題： 「${a} × ${b}」 の答えはどれかな？`,
      options,
      correctAnswer: String(ans),
      explanation: `${a} × ${b} = ${ans} です。`
    };
  }

  // ==========================================
  // 2. 🧪 理科 (オームの法則、仕事、イオン、化学反応式、気圧)
  // ==========================================
  if (subject === 'science') {
    if (uName.includes('オーム') || uName.includes('回路') || uName.includes('電流')) {
      const v = getRandomInt(3, 12);
      const r = getRandomInt(2, 6) * 5; // 10, 15, 20...
      const i = (v / r).toFixed(2);
      const options = shuffle([`${i} A`, `${(v * r).toFixed(0)} A`, `${(v + r).toFixed(0)} A`, `${(r / v).toFixed(1)} A`]);
      return {
        id: `dyn-ohm-${timestamp}`,
        subject: 'science',
        grade,
        questionText: `オームの法則：電圧 ${v}V、抵抗 ${r}Ω の回路に流れる電流 I の大きさは？ (I = V / R)`,
        options,
        correctAnswer: `${i} A`,
        explanation: `オームの法則 I = V / R より、${v}V ÷ ${r}Ω = ${i}A です。`
      };
    }

    const scDB = [
      { q: '水が沸騰して水蒸気（気体）になる現象を何というか？', a: '蒸発', w: ['凝結', '光合成', '呼吸'] },
      { q: '地震で最初に届く早い縦波を何というか？', a: 'P波', w: ['S波', 'T波', '表面波'] },
      { q: '酸性とアルカリ性が反応して水と塩ができる反応は？', a: '中和', w: ['酸化', '還元', '電解'] },
      { q: '植物が光を受けて二酸化炭素と水から栄養（デンプン）を作る働きは？', a: '光合成', w: ['呼吸', '蒸散', '受粉'] },
      { q: '細胞分裂のうち、卵や精子などの生殖細胞を作るときに行われる特別な分裂は？', a: '減数分裂', w: ['体細胞分裂', '出芽', '受精'] }
    ];
    const target = scDB[getRandomInt(0, scDB.length - 1)];
    return {
      id: `dyn-sc-${timestamp}`,
      subject,
      grade,
      questionText: target.q,
      options: ensureUniqueOptions([target.a, ...target.w], target.a, 'science'),
      correctAnswer: target.a,
      explanation: `正解は 「${target.a}」 です。`
    };
  }

  // ==========================================
  // 3. 🗺 社会 (時差計算、歴史、日本国憲法、三権分立)
  // ==========================================
  if (subject === 'social') {
    if (uName.includes('時差') || uName.includes('経度')) {
      const lonDiff = getRandomInt(2, 8) * 15; // 30度, 45度, 60度...
      const hours = lonDiff / 15;
      const options = shuffle([`${hours}時間`, `${hours + 2}時間`, `${hours - 1}時間`, `${lonDiff}時間`]);
      return {
        id: `dyn-time-zone-${timestamp}`,
        subject: 'social',
        grade,
        questionText: `時差計算：2つの都市の経度差が ${lonDiff}° あるとき、時差は何時間になるかな？ (15° = 1時間)`,
        options: ensureUniqueOptions(options, `${hours}時間`, 'social'),
        correctAnswer: `${hours}時間`,
        explanation: `地球は15度で1時間の時差が生じるため、${lonDiff}° ÷ 15 = ${hours}時間 です。`
      };
    }

    const soDB = [
      { q: '日本国憲法の三大原則のうち、「国の政治の決定権は国民にある」という原則は？', a: '国民主権', w: ['基本的人権の尊重', '平和主義', '三権分立'] },
      { q: '日本国憲法第9条で放棄されているものはどれかな？', a: '戦争の放棄と戦力の不保持', w: ['表現の自由', '選挙権', '納税の義務'] },
      { q: '大化の改新（645年）を中心となって進めた人物はだれかな？', a: '中大兄皇子・中臣鎌足', w: ['聖徳太子', '源頼朝', '織田信長'] },
      { q: '江戸幕府を開いた将軍はだれかな？', a: '徳川家康', w: ['徳川家光', '豊臣秀吉', '足利尊氏'] }
    ];
    const target = soDB[getRandomInt(0, soDB.length - 1)];
    return {
      id: `dyn-so-${timestamp}`,
      subject,
      grade,
      questionText: target.q,
      options: ensureUniqueOptions([target.a, ...target.w], target.a, 'social'),
      correctAnswer: target.a,
      explanation: `正解は 「${target.a}」 です。`
    };
  }

  // ==========================================
  // 4. 🔤 英語 (現在完了、関係代名詞、受動態、不定詞)
  // ==========================================
  if (subject === 'english') {
    if (uName.includes('関係代名詞')) {
      const options = shuffle(['who', 'which', 'where', 'whose']);
      return {
        id: `dyn-rel-pronoun-${timestamp}`,
        subject: 'english',
        grade,
        questionText: `「The boy [       ] lives in Tokyo is my friend.」 空欄に入る正しい関係代名詞（人を表す主格）はどれ？`,
        options,
        correctAnswer: 'who',
        explanation: `先行詞が人（The boy）で主格の場合は関係代名詞 who を使います。`
      };
    }

    if (uName.includes('現在完了')) {
      const verbs = [
        { orig: 'live', p: 'lived', jp: '住んでいます' },
        { orig: 'study', p: 'studied', jp: '勉強しています' },
        { orig: 'know', p: 'known', jp: '知っています' }
      ];
      const v = verbs[getRandomInt(0, verbs.length - 1)];
      const years = getRandomInt(2, 5);
      const ans = `I have ${v.p} English for ${years} years.`;
      const options = shuffle([
        ans,
        `I ${v.orig} English for ${years} years.`,
        `I am ${v.orig}ing English ${years} years.`,
        `I was ${v.p} English since ${years} years.`
      ]);
      return {
        id: `dyn-en-perf-${timestamp}`,
        subject: 'english',
        grade,
        questionText: `「私は${years}年間、英語を勉強しています（現在完了・継続）」の正しい英文はどれかな？`,
        options,
        correctAnswer: ans,
        explanation: `過去から現在までの継続を表すには [have + 過去分詞 + for 時間] を使います。`
      };
    }

    const vocabList = [
      { en: 'apple', jp: 'リンゴ' }, { en: 'book', jp: '本' }, { en: 'desk', jp: '机' },
      { en: 'teacher', jp: '先生' }, { en: 'student', jp: '生徒' }, { en: 'school', jp: '学校' },
      { en: 'difficult', jp: '難しい' }, { en: 'important', jp: '重要な' }
    ];
    const target = vocabList[getRandomInt(0, vocabList.length - 1)];
    return {
      id: `dyn-en-${timestamp}`,
      subject: 'english',
      grade,
      questionText: `英単語 「${target.en}」 の意味はどれかな？`,
      options: shuffle([target.jp, '犬', '車', '山']),
      correctAnswer: target.jp,
      explanation: `「${target.en}」 は日本語で 「${target.jp}」 です。`
    };
  }

  // ==========================================
  // 5. 📖 国語 (漢字、部首、四字熟語、古文)
  // ==========================================
  const jpDB = [
    { q: '「油断大敵」の意味として正しいものはどれかな？', a: '気を許すと大変な失敗をするということ', w: ['油を大量に使うこと', '敵と仲良くすること', '大声を出すこと'] },
    { q: '「温故知新」の読み方はどれかな？', a: 'おんこちしん', w: ['おんこちちん', 'おんふるちしん', 'ぬくもりちしん'] },
    { q: '漢字「休」の部首（へん）は何かな？', a: 'にんべん（イ）', w: ['きへん（木）', 'さんずい（氵）', 'くさかんむり（艹）'] }
  ];
  const targetJp = jpDB[getRandomInt(0, jpDB.length - 1)];
  return {
    id: `dyn-jp-${timestamp}`,
    subject: 'japanese',
    grade,
    questionText: targetJp.q,
    options: ensureUniqueOptions([targetJp.a, ...targetJp.w], targetJp.a, 'japanese'),
    correctAnswer: targetJp.a,
    explanation: `正解は 「${targetJp.a}」 です。`
  };
};

// 🌟 選択された教科・学年・単元名に応じた高機能動的問題生成エンジン（すべての選択肢が重複ゼロであることを完全保証）
export const generateDynamicQuestion = (subject: Subject, grade: number, unitName?: string): Question => {
  const rawQuestion = generateRawQuestion(subject, grade, unitName);
  return {
    ...rawQuestion,
    options: ensureUniqueOptions(rawQuestion.options, rawQuestion.correctAnswer, subject)
  };
};
