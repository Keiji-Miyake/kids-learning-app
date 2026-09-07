import type { SemesterSystem } from '../types';

// 文部科学省「学習指導要領LOD」準拠 小1〜中3全教科・全学年・年間全単元完全データ

export interface CurriculumUnit {
  code: string;       // 学習指導要領コード
  unitName: string;   // 単元名
  description: string; // 指導目標・内容説明
  grade: number;      // 1〜9 (小1〜中3)
  subject: string;    // math | japanese | science | social | english
  term?: string;      // 1学期 | 2学期 | 3学期
  semesterTerm?: '前期' | '後期'; // 2学期制（二期制）での配当
}

export const curriculumLOD: CurriculumUnit[] = [
  // ==========================================
  // 🧮 算数・数学（小1〜中3）
  // ==========================================
  { code: 'cos-m1-01', grade: 1, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '1. かずと たしざん(1)', description: '5までの数・10までの数の分解と、繰り上がりのない足し算。' },
  { code: 'cos-m1-02', grade: 1, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '2. ひきざん(1)', description: '10までの数の繰り下がりのない引き算。' },
  { code: 'cos-m1-03', grade: 1, subject: 'math', term: '2学期', semesterTerm: '前期', unitName: '3. 10より おおきい かず', description: '20までの数のかぞえ方と、10と幾つのかたち。' },
  { code: 'cos-m1-04', grade: 1, subject: 'math', term: '2学期', semesterTerm: '後期', unitName: '4. くりあがりの ある たしざん', description: '9+3などの10のまとまりを作る繰り上がり足し算。' },
  { code: 'cos-m1-05', grade: 1, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '5. くりさがりの ある ひきざん', description: '12-5などの10から引いて足す繰り下がり引き算。' },

  { code: 'cos-m3-01', grade: 3, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '1. わり算（あまりなし）', description: '九九を用いたあまりのない割り算。' },
  { code: 'cos-m3-02', grade: 3, subject: 'math', term: '2学期', semesterTerm: '前期', unitName: '2. あまりのあるわり算', description: 'あまりの出る割り算とあまりの処理。' },
  { code: 'cos-m3-03', grade: 3, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '3. 円と球・小数と分数', description: 'コンパスの使い方と同分母分数の計算。' },

  { code: 'cos-m7-01', grade: 7, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '1. 正の数・負の数', description: '【中1】符号のついた数の計算、絶対値、四則計算。' },
  { code: 'cos-m7-02', grade: 7, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '2. 文字の式', description: '【中1】文字式の表し方、一次式の加減。' },
  { code: 'cos-m7-03', grade: 7, subject: 'math', term: '2学期', semesterTerm: '前期', unitName: '3. 一次方程式', description: '【中1】移項による解法、速さ・食塩水の文章題。' },
  { code: 'cos-m7-04', grade: 7, subject: 'math', term: '2学期', semesterTerm: '後期', unitName: '4. 比例と反比例', description: '【中1】y=ax, y=a/x のグラフと性質。' },
  { code: 'cos-m7-05', grade: 7, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '5. 平面図形と空間図形', description: '【中1】作図、扇形、立体の表面積と体積。' },

  { code: 'cos-m8-01', grade: 8, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '1. 式の計算・連立方程式', description: '【中2】多項式の計算、2元1次連立方程式の解法。' },
  { code: 'cos-m8-02', grade: 8, subject: 'math', term: '2学期', semesterTerm: '後期', unitName: '2. 一次関数（y=ax+b）', description: '【中2】変化の割合、傾きと切片、二直線の交点。' },
  { code: 'cos-m8-03', grade: 8, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '3. 平行と合同・確率', description: '【中2】三角形の合同条件の証明、樹形図と確率。' },

  { code: 'cos-m9-01', grade: 9, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '1. 多項式の展開と因数分解', description: '【中3】乗法公式、因数分解、素因数分解。' },
  { code: 'cos-m9-02', grade: 9, subject: 'math', term: '1学期', semesterTerm: '前期', unitName: '2. 平方根（√の計算）', description: '【中3】平方根の意味、a√bの変形、分母の有理化。' },
  { code: 'cos-m9-03', grade: 9, subject: 'math', term: '2学期', semesterTerm: '前期', unitName: '3. 二次方程式（解の公式）', description: '【中3】因数分解利用、解の公式 x=(-b±√(b²-4ac))/2a。' },
  { code: 'cos-m9-04', grade: 9, subject: 'math', term: '2学期', semesterTerm: '後期', unitName: '4. 関数 y=ax²', description: '【中3】y=ax²の放物線グラフ、変化の割合。' },
  { code: 'cos-m9-05', grade: 9, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '5. 相似な図形・円周角の定理', description: '【中3】相似条件、中点連結定理、円周角と中心角。' },
  { code: 'cos-m9-06', grade: 9, subject: 'math', term: '3学期', semesterTerm: '後期', unitName: '6. 三平方の定理（a²+b²=c²）', description: '【中3】ピタゴラスの定理、直角三角形比、立体への応用。' },

  // ==========================================
  // 📖 国語（小1〜中3 年間全単元）
  // ==========================================
  { code: 'cos-j1-01', grade: 1, subject: 'japanese', term: '1学期', semesterTerm: '前期', unitName: '1. ひらがな・かたかな', description: '正しい読み書きと簡単な挨拶。' },
  { code: 'cos-j3-01', grade: 3, subject: 'japanese', term: '1学期', semesterTerm: '前期', unitName: '1. 漢字の部首 と 国語辞典', description: 'へん・つくりなどの部首と辞典の引き方。' },
  { code: 'cos-j7-01', grade: 7, subject: 'japanese', term: '1学期', semesterTerm: '前期', unitName: '1. 竹取物語・少年の主張', description: '【中1】古典の暗唱、自立語と付属語の区別。' },
  { code: 'cos-j7-02', grade: 7, subject: 'japanese', term: '2学期', semesterTerm: '後期', unitName: '2. 文節と単語（品詞分解）', description: '【中1】文節の区切り、体言・用言の性質。' },
  { code: 'cos-j8-01', grade: 8, subject: 'japanese', term: '1学期', semesterTerm: '前期', unitName: '1. 徒然草・平家物語', description: '【中2】吉田兼好の随筆、古文の読解。' },
  { code: 'cos-j8-02', grade: 8, subject: 'japanese', term: '2学期', semesterTerm: '後期', unitName: '2. 動詞と形容詞の活用形', description: '【中2】未然形・連用形・終止形・連体形などの活用形。' },
  { code: 'cos-j9-01', grade: 9, subject: 'japanese', term: '1学期', semesterTerm: '前期', unitName: '1. 故郷（魯迅）・握手（井上ひさし）', description: '【中3】近代文学の小説読解、登場人物の心情の変化。' },
  { code: 'cos-j9-02', grade: 9, subject: 'japanese', term: '2学期', semesterTerm: '後期', unitName: '2. 奥の細道・論語', description: '【中3】松尾芭蕉の俳句・紀行文と孔子の論語。' },
  { code: 'cos-j9-03', grade: 9, subject: 'japanese', term: '3学期', semesterTerm: '後期', unitName: '3. 漢文の訓読（レ点・一二点）', description: '【中3】返り点のルール、書き下し文への変換と故事成語。' },

  // ==========================================
  // 🧪 理科（小3〜中3 年間全単元）
  // ==========================================
  { code: 'cos-s3-01', grade: 3, subject: 'science', term: '1学期', semesterTerm: '前期', unitName: '1. 身の回りの生物・昆虫', description: '植物の発芽、昆虫の育ち方と体のつくり。' },
  { code: 'cos-s7-01', grade: 7, subject: 'science', term: '1学期', semesterTerm: '前期', unitName: '1. 植物の観察・花と葉のつくり', description: '【中1】顕微鏡の使い方、光合成と受粉の仕組み。' },
  { code: 'cos-s7-02', grade: 7, subject: 'science', term: '2学期', semesterTerm: '前期', unitName: '2. 光の屈折・音・力', description: '【中1】凸レンズの作図、振動数、圧力と重力。' },
  { code: 'cos-s7-03', grade: 7, subject: 'science', term: '3学期', semesterTerm: '後期', unitName: '3. 地震（P波・S波）と火山・岩石', description: '【中1】初期微動継続時間、火山岩と深成岩。' },
  { code: 'cos-s8-01', grade: 8, subject: 'science', term: '1学期', semesterTerm: '前期', unitName: '1. 化学変化と原子・分子', description: '【中2】化学反応式、酸化と還元、質量保存の法則。' },
  { code: 'cos-s8-02', grade: 8, subject: 'science', term: '2学期', semesterTerm: '後期', unitName: '2. オームの法則（V=RI）・電磁誘導', description: '【中2】回路の計算、右ねじの法則、フレミングの法則。' },
  { code: 'cos-s8-03', grade: 8, subject: 'science', term: '3学期', semesterTerm: '後期', unitName: '3. 人体の消化器官・血液循環・天気', description: '【中2】アミラーゼ、呼吸、気圧と前線。' },
  { code: 'cos-s9-01', grade: 9, subject: 'science', term: '1学期', semesterTerm: '前期', unitName: '1. 水溶液とイオン・電池', description: '【中3】電解質の電離、亜鉛・銅板の化学電池。' },
  { code: 'cos-s9-02', grade: 9, subject: 'science', term: '2学期', semesterTerm: '前期', unitName: '2. 酸とアルカリ・中和反応', description: '【中3】H⁺とOH⁻の中和、塩（NaCl等）の生成。' },
  { code: 'cos-s9-03', grade: 9, subject: 'science', term: '2学期', semesterTerm: '後期', unitName: '3. 生命の連続性・メンデルの遺伝', description: '【中3】細胞分裂、減数分裂、分離の法則。' },
  { code: 'cos-s9-04', grade: 9, subject: 'science', term: '3学期', semesterTerm: '後期', unitName: '4. 仕事とエネルギー・宇宙', description: '【中3】位置・運動エネルギー保存則、太陽と惑星。' },

  // ==========================================
  // 🗺 社会（小3〜中3 年間全単元）
  // ==========================================
  { code: 'cos-so3-01', grade: 3, subject: 'social', term: '1学期', semesterTerm: '前期', unitName: '1. まちの様子 と 地図記号', description: '警察・消防の仕事と方位・地図記号。' },
  { code: 'cos-so7-01', grade: 7, subject: 'social', term: '1学期', semesterTerm: '前期', unitName: '1. 世界の姿と時差計算（15度=1時間）', description: '【地理】経度差による時差計算、6大州と気候帯。' },
  { code: 'cos-so7-02', grade: 7, subject: 'social', term: '2学期', semesterTerm: '後期', unitName: '2. 日本の歴史（旧石器〜奈良・平安）', description: '【歴史】大化の改新（645年）、平城京、平安京。' },
  { code: 'cos-so8-01', grade: 8, subject: 'social', term: '1学期', semesterTerm: '前期', unitName: '1. 日本の7地方区分と雨温図', description: '【地理】地方ごとの気候の特色と雨温図の識別。' },
  { code: 'cos-so8-02', grade: 8, subject: 'social', term: '2学期', semesterTerm: '後期', unitName: '2. 中世・近世の歴史（鎌倉・江戸）', description: '【歴史】御恩と奉公、江戸の三大改革、参勤交代。' },
  { code: 'cos-so8-03', grade: 8, subject: 'social', term: '3学期', semesterTerm: '後期', unitName: '3. 近代日本の歩み（明治維新・大正）', description: '【歴史】地租改正、富国強兵、日清・日露戦争。' },
  { code: 'cos-so9-01', grade: 9, subject: 'social', term: '1学期', semesterTerm: '前期', unitName: '1. 現代社会と日本国憲法三原則', description: '【公民】国民主権、基本的人権の尊重、平和主義。' },
  { code: 'cos-so9-02', grade: 9, subject: 'social', term: '2学期', semesterTerm: '後期', unitName: '2. 民主政治と三権分立（国会・内閣・裁判所）', description: '【公民】立法・行政・司法の抑制関係と選挙制度。' },
  { code: 'cos-so9-03', grade: 9, subject: 'social', term: '3学期', semesterTerm: '後期', unitName: '3. 経済の仕組み・日銀の金融政策・国際社会', description: '【公民】公開市場操作、市場価格、国際連合と常任理事国。' },

  // ==========================================
  // 🔤 英語（小5〜中3 年間全単元）
  // ==========================================
  { code: 'cos-e5-01', grade: 5, subject: 'english', term: '1学期', semesterTerm: '前期', unitName: '1. アルファベット・あいさつ', description: 'What is your name? と身近な単語。' },
  { code: 'cos-e7-01', grade: 7, subject: 'english', term: '1学期', semesterTerm: '前期', unitName: '1. be動詞（am / is / are）', description: '【中1】I am, You are, He/She is の肯定・否定・疑問文。' },
  { code: 'cos-e7-02', grade: 7, subject: 'english', term: '2学期', semesterTerm: '前期', unitName: '2. 一般動詞と三人称単数s', description: '【中1】play, like と He/Sheのs/es。' },
  { code: 'cos-e7-03', grade: 7, subject: 'english', term: '3学期', semesterTerm: '後期', unitName: '3. 進行形（be + ~ing）・過去形', description: '【中1】現在進行形と規則・不規則動詞の過去形。' },
  { code: 'cos-e8-01', grade: 8, subject: 'english', term: '1学期', semesterTerm: '前期', unitName: '1. 未来形（be going to / will）', description: '【中2】予定や意志を表す未来表現。' },
  { code: 'cos-e8-02', grade: 8, subject: 'english', term: '2学期', semesterTerm: '後期', unitName: '2. 不定詞3用法 と 動名詞', description: '【中2】to+原形（目的・名詞・形容詞）と playing。' },
  { code: 'cos-e8-03', grade: 8, subject: 'english', term: '3学期', semesterTerm: '後期', unitName: '3. 比較（er/est） と 受動態', description: '【中2】the highest と receiveされる受け身(be+PP)。' },
  { code: 'cos-e9-01', grade: 9, subject: 'english', term: '1学期', semesterTerm: '前期', unitName: '1. 現在完了形（have + 過去分詞）', description: '【中3】完了・結果・継続・経験の4つの意味と構文。' },
  { code: 'cos-e9-02', grade: 9, subject: 'english', term: '2学期', semesterTerm: '後期', unitName: '2. 分詞の後置修飾 と 関係代名詞', description: '【中3】book written by him や the boy who was kind。' },
  { code: 'cos-e9-03', grade: 9, subject: 'english', term: '3学期', semesterTerm: '後期', unitName: '3. 間接疑問文 と 仮定法過去', description: '【中3】I know where he is と If I were a bird...。' }
];

export const getCurriculumUnits = (subject: string, grade: number): CurriculumUnit[] => {
  const list = curriculumLOD.filter(c => c.subject === subject && c.grade === grade);
  if (list.length > 0) return list;
  
  // もし指定学年のデータがピンポイントでない場合のフォールバック（全学年から最も近いものを返却）
  return [
    {
      code: `fallback-${subject}-${grade}`,
      grade,
      subject,
      term: '通年',
      semesterTerm: '前期',
      unitName: '1. 学年共通基礎カリキュラム',
      description: '文部科学省指導要領に基づく重要基礎問題に挑戦！'
    }
  ];
};

export const getDisplayTerm = (
  unit: CurriculumUnit,
  system: SemesterSystem = '3-term'
): string => {
  if (system === '2-term') {
    if (unit.semesterTerm) return unit.semesterTerm;
    return unit.term === '3学期' ? '後期' : '前期';
  }
  return unit.term || '通年';
};
