import type { Question } from '../types';

export const questions: Question[] = [
  // ==========================================
  // 🧮 算数・数学
  // ==========================================
  {
    id: 'math-g1-1',
    subject: 'math',
    grade: 1,
    questionText: 'りんごが 5こ あります。3こ たべると、のこりは なんこ になるかな？',
    options: ['1こ', '2こ', '3こ', '4こ'],
    correctAnswer: '2こ',
    explanation: '5 - 3 = 2 なので、のこりは 2こ になります。'
  },
  {
    id: 'math-g1-2',
    subject: 'math',
    grade: 1,
    questionText: '7 と 3 を あわせると、いくつに なるかな？',
    options: ['8', '9', '10', '11'],
    correctAnswer: '10',
    explanation: '7 + 3 = 10 になります。'
  },
  {
    id: 'math-g2-1',
    subject: 'math',
    grade: 2,
    questionText: '九九（くく）のもんだい！ 「6 × 4」の こたえは どれかな？',
    options: ['20', '24', '28', '32'],
    correctAnswer: '24',
    explanation: 'ろく し にじゅうし！ 6 × 4 = 24 です。'
  },
  {
    id: 'math-g2-2',
    subject: 'math',
    grade: 2,
    questionText: '1メートル（1m）は、なんセンチメートル（cm）かな？',
    options: ['10cm', '50cm', '100cm', '1000cm'],
    correctAnswer: '100cm',
    explanation: '1m は 100cm です。'
  },
  {
    id: 'math-g3-1',
    subject: 'math',
    grade: 3,
    questionText: 'この円の中で、色がついている部分は全体のどれだけかな？（分数）',
    options: ['1/2', '1/3', '1/4', '3/4'],
    correctAnswer: '3/4',
    explanation: '円が4つに分けられていて、そのうち3つに色がついているので 3/4 です。',
    visualData: {
      type: 'fraction',
      value: { numerator: 3, denominator: 4 }
    }
  },
  {
    id: 'math-g3-2',
    subject: 'math',
    grade: 3,
    questionText: '「72 ÷ 8」の こたえは どれかな？',
    options: ['7', '8', '9', '10'],
    correctAnswer: '9',
    explanation: '8 × 9 = 72 なので、答えは 9 です。'
  },
  {
    id: 'math-g4-1',
    subject: 'math',
    grade: 4,
    questionText: '長方形の面積を求める公式はどれかな？',
    options: ['たて × 横', '底辺 × 高さ ÷ 2', '一辺 × 4', '半径 × 半径 × 3.14'],
    correctAnswer: 'たて × 横',
    explanation: '長方形の面積は「たて × 横」で計算します。'
  },
  {
    id: 'math-g4-2',
    subject: 'math',
    grade: 4,
    questionText: '直角（90度）の2倍の角度（180度）のことを何というか？',
    options: ['鋭角', '鈍角', '平角', '周角'],
    correctAnswer: '平角',
    explanation: '180度のまっすぐな角度のことを「平角（へいかく）」といいます。'
  },
  {
    id: 'math-g5-1',
    subject: 'math',
    grade: 5,
    questionText: '三角形の面積を求める公式はどれかな？',
    options: ['底辺 × 高さ', '底辺 × 高さ ÷ 2', '（上底 ＋ 下底）× 高さ ÷ 2', '一辺 × 一辺'],
    correctAnswer: '底辺 × 高さ ÷ 2',
    explanation: '三角形の面積は「底辺 × 高さ ÷ 2」で求められます。'
  },
  {
    id: 'math-g5-2',
    subject: 'math',
    grade: 5,
    questionText: '2/5 と 1/3 を通分して足すと、いくつになるかな？',
    options: ['3/8', '11/15', '7/15', '13/15'],
    correctAnswer: '11/15',
    explanation: '分母を15に揃えると 6/15 + 5/15 = 11/15 になります。'
  },
  {
    id: 'math-g6-1',
    subject: 'math',
    grade: 6,
    questionText: '円の面積を求める公式はどれかな？',
    options: ['直径 × 3.14', '半径 × 2 × 3.14', '半径 × 半径 × 3.14', '底辺 × 高さ ÷ 2'],
    correctAnswer: '半径 × 半径 × 3.14',
    explanation: '円の面積は「半径 × 半径 × 円周率（約3.14）」で求めます。'
  },
  {
    id: 'math-g6-2',
    subject: 'math',
    grade: 6,
    questionText: '300円の 20% オフ（2割引）は、いくらかな？',
    options: ['60円', '200円', '240円', '280円'],
    correctAnswer: '240円',
    explanation: '割引額は 300 × 0.2 = 60円。代金は 300 - 60 = 240円です。'
  },
  {
    id: 'math-g7-1', // 中1
    subject: 'math',
    grade: 7,
    questionText: '次の計算の答えはどれかな？ （-5） ＋ （-8）',
    options: ['-13', '-3', '3', '13'],
    correctAnswer: '-13',
    explanation: '負の数どうしの足し算なので、絶対値を足してマイナスをつけます。-5 - 8 = -13。'
  },
  {
    id: 'math-g7-2',
    subject: 'math',
    grade: 7,
    questionText: '方程式 「3x - 5 = 10」 の解 x はどれかな？',
    options: ['x = 3', 'x = 5', 'x = 15', 'x = 30'],
    correctAnswer: 'x = 5',
    explanation: '3x = 15 より、x = 5 となります。'
  },
  {
    id: 'math-g8-1', // 中2
    subject: 'math',
    grade: 8,
    questionText: '一次関数 「y = 2x ＋ 3」 の変化の割合（傾き）はどれかな？',
    options: ['2', '3', '5', '2/3'],
    correctAnswer: '2',
    explanation: 'y = ax + b の形式で、aが変化の割合（傾き）を表すので 2 です。'
  },
  {
    id: 'math-g8-2',
    subject: 'math',
    grade: 8,
    questionText: '三角形の3つの内角の和は何度かな？',
    options: ['90度', '180度', '270度', '360度'],
    correctAnswer: '180度',
    explanation: 'どんな三角形でも、内角の和は必ず180度になります。'
  },
  {
    id: 'math-g9-1', // 中3
    subject: 'math',
    grade: 9,
    questionText: '展開しなさい： (x ＋ 3)(x - 3)',
    options: ['x² - 9', 'x² ＋ 6x ＋ 9', 'x² - 6x ＋ 9', 'x² - 3'],
    correctAnswer: 'x² - 9',
    explanation: '(a+b)(a-b) = a² - b² の公式より、x² - 3² = x² - 9 になります。'
  },
  {
    id: 'math-g9-2',
    subject: 'math',
    grade: 9,
    questionText: '直角三角形の斜辺をc、他の2辺をa, bとするとき成立する「三平方の定理」はどれかな？',
    options: ['a ＋ b = c', 'a² ＋ b² = c²', 'a² ＋ b² = 2c', 'ab = c²'],
    correctAnswer: 'a² ＋ b² = c²',
    explanation: 'ピタゴラスの定理（三平方の定理）は a² + b² = c² です。'
  },

  // ==========================================
  // 📖 国語
  // ==========================================
  {
    id: 'jp-g1-1',
    subject: 'japanese',
    grade: 1,
    questionText: '「いぬ」を かん字で かくと どれかな？',
    options: ['犬', '太', '大', '天'],
    correctAnswer: '犬',
    explanation: 'いぬ は「犬」と書きます。'
  },
  {
    id: 'jp-g1-2',
    subject: 'japanese',
    grade: 1,
    questionText: '「学校」の ただし いよみかたは どれかな？',
    options: ['がこう', 'がっこう', 'かくこう', 'がっこうう'],
    correctAnswer: 'がっこう',
    explanation: 'がっこう と読みます。'
  },
  {
    id: 'jp-g2-1',
    subject: 'japanese',
    grade: 2,
    questionText: '「新」という漢字の読み方はどれかな？',
    options: ['あたら（しい）', 'ふる（い）', 'やす（い）', 'たか（い）'],
    correctAnswer: 'あたら（しい）',
    explanation: '「新」は「新しい」と読みます。'
  },
  {
    id: 'jp-g2-2',
    subject: 'japanese',
    grade: 2,
    questionText: '「たかい」の 反対（はんたい）の意味のことばはどれかな？',
    options: ['ひくい', 'みじかい', 'ちいさい', 'おそい'],
    correctAnswer: 'ひくい',
    explanation: '「高い」の反対は「低い（ひくい）」です。'
  },
  {
    id: 'jp-g3-1',
    subject: 'japanese',
    grade: 3,
    questionText: '「春・夏・秋・冬」をまとめて何というか？',
    options: ['四季（しき）', '四方（しほう）', '四角（しかく）', '四天（してん）'],
    correctAnswer: '四季（しき）',
    explanation: '1年の中の4つの季節を「四季」といいます。'
  },
  {
    id: 'jp-g3-2',
    subject: 'japanese',
    grade: 3,
    questionText: '「心」を部首（ぶしゅ）にもつ漢字はどれかな？',
    options: ['思', '花', '休', '男'],
    correctAnswer: '思',
    explanation: '「思」のしたの部分には「心」が入っています。'
  },
  {
    id: 'jp-g4-1',
    subject: 'japanese',
    grade: 4,
    questionText: '「猫に小判」と同じような意味のことわざはどれかな？',
    options: ['馬の耳に念仏', '猿も木から落ちる', '石の上にも三年', '犬も歩けば棒に当たる'],
    correctAnswer: '馬の耳に念仏',
    explanation: '価値がわからない人に価値あるものを与えても意味がないことのたとえです。'
  },
  {
    id: 'jp-g4-2',
    subject: 'japanese',
    grade: 4,
    questionText: '「都道府県」の「県」の部首はどれかな？',
    options: ['目（め）', '木（き）', '糸（いと）', '⺅（にんべん）'],
    correctAnswer: '目（め）',
    explanation: '「県」の部首は「目（め・めへん）」です。'
  },
  {
    id: 'jp-g5-1',
    subject: 'japanese',
    grade: 5,
    questionText: '「温故知新（おんこちしん）」の意味として正しいものはどれかな？',
    options: [
      '古い教えを学び、新しい知識や考えを得ること',
      '新しいことばかりを追求すること',
      '過去の失敗をいつまでも悔やむこと',
      '友達と仲良く力を合わせること'
    ],
    correctAnswer: '古い教えを学び、新しい知識や考えを得ること',
    explanation: '昔の事をよく調べて、そこから新しい知識や見解を得ることを言います。'
  },
  {
    id: 'jp-g5-2',
    subject: 'japanese',
    grade: 5,
    questionText: '敬語（けいご）のうち、相手を高める言い方はどれかな？',
    options: ['尊敬語（そんけいご）', '謙譲語（けんじょうご）', '丁寧語（ていねいご）', '美化語'],
    correctAnswer: '尊敬語（そんけいご）',
    explanation: '相手の行動を高めて敬意を表す言葉を「尊敬語」といいます。'
  },
  {
    id: 'jp-g6-1',
    subject: 'japanese',
    grade: 6,
    questionText: '「千載一遇（せんざいいちぐう）」と同じような意味の四字熟語はどれかな？',
    options: ['絶体絶命', '一期一会', '千載一千', '前代未聞'],
    correctAnswer: '一期一会',
    explanation: '「千載一遇」は滅多にない恵まれた機会のことです。「一期一会」も一生に一度の出会いを意味します。'
  },
  {
    id: 'jp-g6-2',
    subject: 'japanese',
    grade: 6,
    questionText: '「推敲（すいこう）」という言葉の由来となった詩人は誰の詩を推敲したかな？',
    options: ['賈島（かとう）', '李白（りはく）', '杜甫（とほ）', '王維（おうい）'],
    correctAnswer: '賈島（かとう）',
    explanation: '唐の詩人・賈島が「推す」か「敲く（たたく）」かで悩んだ故事から文章を吟味・修正することを「推敲」といいます。'
  },
  {
    id: 'jp-g7-1', // 中1
    subject: 'japanese',
    grade: 7,
    questionText: '竹取物語の冒頭「いまはむかし、たけとりのおきなといふものありけり」の「おきな」の意味は？',
    options: ['おじいさん', 'おばあさん', 'わかもの', '子ども'],
    correctAnswer: 'おじいさん',
    explanation: '「翁（おきな）」はおじいさん（老翁）のことです。'
  },
  {
    id: 'jp-g7-2',
    subject: 'japanese',
    grade: 7,
    questionText: '「走れメロス」の作者は誰かな？',
    options: ['太宰治', '芥川龍之介', '夏目漱石', '宮沢賢治'],
    correctAnswer: '太宰治',
    explanation: '「走れメロス」や「人間失格」の作者は太宰治（だざいおさむ）です。'
  },
  {
    id: 'jp-g8-1', // 中2
    subject: 'japanese',
    grade: 8,
    questionText: '「五月雨」の正しい読み方はどれかな？',
    options: ['さつきあめ', 'ごがつう', 'さみだれ', 'いつかあめ'],
    correctAnswer: 'さみだれ',
    explanation: '旧暦5月頃に降る長雨（梅雨）のことで「さみだれ」と読みます。'
  },
  {
    id: 'jp-g8-2',
    subject: 'japanese',
    grade: 8,
    questionText: '「徒然草（つれづれぐさ）」の作者は誰かな？',
    options: ['兼好法師（吉田兼好）', '清少納言', '紫式部', '鴨長明'],
    correctAnswer: '兼好法師（吉田兼好）',
    explanation: '日本三大随筆の一つ「徒然草」は兼好法師によって書かれました。'
  },
  {
    id: 'jp-g9-1', // 中3
    subject: 'japanese',
    grade: 9,
    questionText: '「奥の細道」の冒頭「月日は百代の過客にして、行きかふ年もまた旅人なり」を書いた俳人は？',
    options: ['松尾芭蕉', '与謝蕪村', '小林一茶', '正岡子規'],
    correctAnswer: '松尾芭蕉',
    explanation: '江戸時代の俳聖・松尾芭蕉（まつおばしょう）の最高傑作です。'
  },
  {
    id: 'jp-g9-2',
    subject: 'japanese',
    grade: 9,
    questionText: '漢文の訓読で、下から上へ1字飛ばして戻って読むときに使う返り点はどれかな？',
    options: ['レ点', '一・二点', '上・下点', '甲・乙点'],
    correctAnswer: 'レ点',
    explanation: 'すぐ下の文字から上の文字へと返って読む記号が「レ点」です。'
  },

  // ==========================================
  // 🧪 理科
  // ==========================================
  {
    id: 'sc-g1-1',
    subject: 'science',
    grade: 1,
    questionText: 'あさがおの 花は、いつの 時間に さくことが 多いかな？',
    options: ['あさ', 'ひる', 'ゆうがた', 'よる'],
    correctAnswer: 'あさ',
    explanation: 'あさがおは、早朝の明るくなる頃にきれいな花を咲かせます。'
  },
  {
    id: 'sc-g1-2',
    subject: 'science',
    grade: 1,
    questionText: 'カブトムシの あしの かずは、ぜんぶで なんぼんかな？',
    options: ['4ほん', '6ほん', '8ほん', '10ほん'],
    correctAnswer: '6ほん',
    explanation: '昆虫（こんちゅう）のあしは ぜんぶで 6本です。'
  },
  {
    id: 'sc-g2-1',
    subject: 'science',
    grade: 2,
    questionText: 'じしゃくの 「Sきょく」と 「Nきょく」を 近づけると、どうなるかな？',
    options: ['引きあう（くっつく）', '退けあう（離れる）', 'なにもおきない', 'あつくなる'],
    correctAnswer: '引きあう（くっつく）',
    explanation: 'じしゃくの違うきょく（NとS）どうしは強く引きあいます。'
  },
  {
    id: 'sc-g2-2',
    subject: 'science',
    grade: 2,
    questionText: 'オタマジャクシが 成長すると、なんという 生物になるかな？',
    options: ['カエル', 'ヤゴ', 'メダカ', 'トカゲ'],
    correctAnswer: 'カエル',
    explanation: 'オタマジャクシは成長すると足が生えてカエルになります。'
  },
  {
    id: 'sc-g3-1',
    subject: 'science',
    grade: 3,
    questionText: 'ヒマワリの花は、お日様のあるどの方角を向くことが多いかな？',
    options: ['東', '西', '南', '北'],
    correctAnswer: '東',
    explanation: '咲いたヒマワリの花は東を向いて固定されることが多いです。'
  },
  {
    id: 'sc-g3-2',
    subject: 'science',
    grade: 3,
    questionText: '昆虫の身体は「頭」「胸」と、あと一つのどこに分かれているかな？',
    options: ['腹（はら）', '背中', '手', 'しっぽ'],
    correctAnswer: '腹（はら）',
    explanation: '昆虫の身体は「頭（あたま）」「胸（むね）」「腹（はら）」の3つに分かれます。'
  },
  {
    id: 'sc-g4-1',
    subject: 'science',
    grade: 4,
    questionText: '水蒸気（気体）が冷やされて、水のつぶ（液体）になる現象を何というか？',
    options: ['凝結（ぎょうけつ）', '蒸発（じょうはつ）', '沸騰（ふっとう）', '保冷'],
    correctAnswer: '凝結（ぎょうけつ）',
    explanation: '水蒸気が冷えて水滴になることを凝結（または結露）といいます。'
  },
  {
    id: 'sc-g4-2',
    subject: 'science',
    grade: 4,
    questionText: '星座の「夏の大三角」を作る3つの星のうち、わし座の星はどれかな？',
    options: ['アルタイル（彦星）', 'ベガ（織姫星）', 'デネブ', 'シリウス'],
    correctAnswer: 'アルタイル（彦星）',
    explanation: 'わし座のアルタイル（彦星）、こと座のベガ（織姫星）、はくちょう座のデネブで夏の大三角を作ります。'
  },
  {
    id: 'sc-g5-1',
    subject: 'science',
    grade: 5,
    questionText: '発芽（はつが）に必要な3つの条件は「水」「空気」と、あと一つはどれかな？',
    options: ['適当な温度', '日光', '土', '肥料'],
    correctAnswer: '適当な温度',
    explanation: '種子の発芽に必要な3条件は「水」「空気（酸素）」「適当な温度」です。肥料や日光は発芽後の成長に必要な条件です。'
  },
  {
    id: 'sc-g5-2',
    subject: 'science',
    grade: 5,
    questionText: '心臓から体全体へと血液が送り出される太い血管を何というか？',
    options: ['動脈（どうみゃく）', '静脈（じょうみゃく）', '毛細血管', 'リンパ管'],
    correctAnswer: '動脈（どうみゃく）',
    explanation: '心臓から送り出される血液が流れる血管を「動脈」といいます。'
  },
  {
    id: 'sc-g6-1',
    subject: 'science',
    grade: 6,
    questionText: '月が自分で光っているように見えるのはなぜかな？',
    options: ['太陽の光を反射しているから', '月自体が燃えているから', '地球の光が反射しているから', '星が集まっているから'],
    correctAnswer: '太陽の光を反射しているから',
    explanation: '月は自分自身で発光せず、太陽の光を鏡のように反射して輝いています。'
  },
  {
    id: 'sc-g6-2',
    subject: 'science',
    grade: 6,
    questionText: '酸性の水溶液に「赤色リトマス紙」をつけると何色に変化するかな？',
    options: ['変化しない（赤のまま）', '青色になる', '緑色になる', '黄色になる'],
    correctAnswer: '変化しない（赤のまま）',
    explanation: '酸性は青色リトマス紙を赤に変えます。赤色リトマス紙は変化しません。'
  },
  {
    id: 'sc-g7-1', // 中1
    subject: 'science',
    grade: 7,
    questionText: '植物が光を受けて酸素とデンプンを作るはたらきを何というか？',
    options: ['光合成', '呼吸作用', '蒸散作用', '受粉'],
    correctAnswer: '光合成',
    explanation: '葉緑体で光のエネルギーを使い、二酸化炭素と水から有機物と酸素を作る反応です。'
  },
  {
    id: 'sc-g7-2',
    subject: 'science',
    grade: 7,
    questionText: '火山岩に見られる、細かい結晶の間に小さな鉱物が散らばった組織を何というか？',
    options: ['斑状組織（はんじょうそしき）', '等粒状組織', '変成組織', '柱状節理'],
    correctAnswer: '斑状組織（はんじょうそしき）',
    explanation: '地表近くで急速に冷えてできた火山岩の組織を斑状組織といいます。'
  },
  {
    id: 'sc-g8-1', // 中2
    subject: 'science',
    grade: 8,
    questionText: '化学変化で熱を発生し、周囲の温度を上げる反応を何というか？',
    options: ['発熱反応', '吸熱反応', '還元反応', '中和反応'],
    correctAnswer: '発熱反応',
    explanation: '熱を外部に放出する化学反応を「発熱反応」といいます（例：使い捨てカイロ）。'
  },
  {
    id: 'sc-g8-2',
    subject: 'science',
    grade: 8,
    questionText: '気圧の単位で使われる 「hPa」 の読み方はどれかな？',
    options: ['ヘクトパスカル', 'ヘクトピクセル', 'ハイパスカル', 'エイチパスカル'],
    correctAnswer: 'ヘクトパスカル',
    explanation: '気象分野の気圧の単位はヘクトパスカル（hPa）です。1hPa = 100Pa。'
  },
  {
    id: 'sc-g9-1', // 中3
    subject: 'science',
    grade: 9,
    questionText: '遺伝の規則性を発見した「エンドウ豆の研究」で有名な科学者は誰かな？',
    options: ['メンデル', 'ダーウィン', 'フック', 'パスツール'],
    correctAnswer: 'メンデル',
    explanation: 'オーストリアの修道士メンデルがエンドウを用いて遺伝の法則（分離の法則など）を発見しました。'
  },
  {
    id: 'sc-g9-2',
    subject: 'science',
    grade: 9,
    questionText: '酸とアルカリの水溶液を混ぜ合わせたとき、互いの性質を打ち消し合う反応を何というか？',
    options: ['中和', '酸化', '還元', '電解'],
    correctAnswer: '中和',
    explanation: 'H⁺ と OH⁻ が結びついて H₂O（水）と塩（えん）ができる反応を「中和」といいます。'
  },

  // ==========================================
  // 🗺 社会
  // ==========================================
  {
    id: 'so-g1-1',
    subject: 'social',
    grade: 1,
    questionText: '信号機（しんごうき）の 「進んでもよい」 色はどれかな？',
    options: ['青（緑）', '赤', '黄', '紫'],
    correctAnswer: '青（緑）',
    explanation: '青色の信号は進んでもよい意味です。'
  },
  {
    id: 'so-g1-2',
    subject: 'social',
    grade: 1,
    questionText: '日本の 国旗（こっき）に えがかれている 丸いかたちの 色はどれかな？',
    options: ['赤', '青', '黄', '黒'],
    correctAnswer: '赤',
    explanation: '日本の国旗（日の丸）は白い地に赤くて丸い太陽が描かれています。'
  },
  {
    id: 'so-g2-1',
    subject: 'social',
    grade: 2,
    questionText: '町の中で 火事（かじ）がおきたとき、たすけに来てくれる車はどれかな？',
    options: ['しょうぼうしゃ', 'パトカー', 'きゅうきゅうしゃ', 'ゴミしゅうしゅうしゃ'],
    correctAnswer: 'しょうぼうしゃ',
    explanation: '火事のときは消防車が駆けつけて消火活動をします。'
  },
  {
    id: 'so-g2-2',
    subject: 'social',
    grade: 2,
    questionText: '日本にある 都道府県（とどうふけん）は、ぜんぶで いくつあるかな？',
    options: ['47', '50', '43', '30'],
    correctAnswer: '47',
    explanation: '1都1道2府43県で、全部で47あります。'
  },
  {
    id: 'so-g3-1',
    subject: 'social',
    grade: 3,
    questionText: '地図の上の部分（上方向）は、ふつうどの方角を表しているかな？',
    options: ['北', '南', '東', '西'],
    correctAnswer: '北',
    explanation: '一般的な地図では、上が「北」を表します。'
  },
  {
    id: 'so-g3-2',
    subject: 'social',
    grade: 3,
    questionText: '消防署（しょうぼうしょ）に電話するときにかける番号はどれかな？',
    options: ['119', '110', '118', '104'],
    correctAnswer: '119',
    explanation: '火事や救急の通報は「119番」です（警察は110番）。'
  },
  {
    id: 'so-g4-1',
    subject: 'social',
    grade: 4,
    questionText: '日本で一番広い都道府県はどこかな？',
    options: ['北海道', '岩手県', '東京都', '沖縄県'],
    correctAnswer: '北海道',
    explanation: '日本で最も面積が大きい都道府県は北海道です。'
  },
  {
    id: 'so-g4-2',
    subject: 'social',
    grade: 4,
    questionText: '輪中（わじゅう）という水害を防ぐ堤防で囲まれた地域がある川はどこかな？',
    options: ['木曽三川（きそさんせん）', '信濃川', '利根川', '淀川'],
    correctAnswer: '木曽三川（きそさんせん）',
    explanation: '岐阜県・愛知県・三重県にまたがる木曽川・長良川・揖斐川の流域に輪中が見られます。'
  },
  {
    id: 'so-g5-1',
    subject: 'social',
    grade: 5,
    questionText: '日本で一番長い川はどれかな？',
    options: ['信濃川（しなのがわ）', '利根川', '石狩川', '吉野川'],
    correctAnswer: '信濃川（しなのがわ）',
    explanation: '日本最長の川は信濃川（千曲川）で約367kmあります（流域面積1位は利根川）。'
  },
  {
    id: 'so-g5-2',
    subject: 'social',
    grade: 5,
    questionText: '米づくりが盛んな新潟県などの地域が広がる平野はどこかな？',
    options: ['越後平野（えちごへいや）', '関東平野', '濃尾平野', '筑紫平野'],
    correctAnswer: '越後平野（えちごへいや）',
    explanation: '新潟県の越後平野は日本有数の米どころです。'
  },
  {
    id: 'so-g6-1',
    subject: 'social',
    grade: 6,
    questionText: '江戸時代に「奥の細道」を著した有名な俳人は誰かな？',
    options: ['松尾芭蕉', '近松門左衛門', '歌川広重', '本居宣長'],
    correctAnswer: '松尾芭蕉',
    explanation: '松尾芭蕉は東北や北陸を旅して奥の細道を執筆しました。'
  },
  {
    id: 'so-g6-2',
    subject: 'social',
    grade: 6,
    questionText: '聖徳太子が定めた、役人の心構えを示した制度はどれかな？',
    options: ['十七条の憲法', '冠位十二階', '大化の改新', '大宝律令'],
    correctAnswer: '十七条の憲法',
    explanation: '和を以て貴しとなす、で始まる役人の道徳的規範を定めたのが十七条の憲法です。'
  },
  {
    id: 'so-g7-1', // 中1
    subject: 'social',
    grade: 7,
    questionText: '赤道が通る緯度（いど）は何度かな？',
    options: ['0度', '30度', '60度', '90度'],
    correctAnswer: '0度',
    explanation: '赤道は緯度0度です。北極・南極が90度になります。'
  },
  {
    id: 'so-g7-2',
    subject: 'social',
    grade: 7,
    questionText: '710年に奈良に造営された都はどれかな？',
    options: ['平城京（へいじょうきょう）', '平安京', '藤原京', '長岡京'],
    correctAnswer: '平城京（へいじょうきょう）',
    explanation: '「なんと（710）綺麗な平城京」で覚える奈良の都です。'
  },
  {
    id: 'so-g8-1', // 中2
    subject: 'social',
    grade: 8,
    questionText: '世界で一番広い海洋（海）はどれかな？',
    options: ['太平洋', '大西洋', 'インド洋', '北極海'],
    correctAnswer: '太平洋',
    explanation: '世界最大面積の海洋は太平洋です。'
  },
  {
    id: 'so-g8-2',
    subject: 'social',
    grade: 8,
    questionText: '1603年に江戸幕府を開いた人物は誰かな？',
    options: ['徳川家康', '織田信長', '豊臣秀吉', '足利尊氏'],
    correctAnswer: '徳川家康',
    explanation: '関ヶ原の戦いに勝利した徳川家康が江戸幕府を開きました。'
  },
  {
    id: 'so-g9-1', // 中3
    subject: 'social',
    grade: 9,
    questionText: '日本国憲法の「三原則」に含まれないものはどれかな？',
    options: ['地方自治の確立', '国民主権', '基本的人権の尊重', '平和主義'],
    correctAnswer: '地方自治の確立',
    explanation: '日本国憲法の三大原則は「国民主権」「基本的人権の尊重」「平和主義」です。'
  },
  {
    id: 'so-g9-2',
    subject: 'social',
    grade: 9,
    questionText: '日本の国会において、衆議院と参議院の意見が一致しないとき開かれる会議は？',
    options: ['両院協議会', '本会議', '予算委員会', '最高裁判所'],
    correctAnswer: '両院協議会',
    explanation: '衆議院と参議院の議決が異なった場合、調整のために開かれるのが両院協議会です。'
  },

  // ==========================================
  // 🔤 英語
  // ==========================================
  {
    id: 'en-g1-1',
    subject: 'english',
    grade: 1,
    questionText: '「いぬ」を えいごで 言うと どれかな？',
    options: ['dog', 'cat', 'bird', 'fish'],
    correctAnswer: 'dog',
    explanation: 'いぬ は英語で dog（ドッグ）です。'
  },
  {
    id: 'en-g1-2',
    subject: 'english',
    grade: 1,
    questionText: '「ありがとう」を えいごで 言うと どれかな？',
    options: ['Thank you', 'Hello', 'Good bye', 'Sorry'],
    correctAnswer: 'Thank you',
    explanation: '感謝を伝える言葉は Thank you です。'
  },
  {
    id: 'en-g2-1',
    subject: 'english',
    grade: 2,
    questionText: '「赤（あか）」を 英語で書くと どれかな？',
    options: ['red', 'blue', 'yellow', 'green'],
    correctAnswer: 'red',
    explanation: '赤は red（レッド）です。'
  },
  {
    id: 'en-g2-2',
    subject: 'english',
    grade: 2,
    questionText: '数字の 「10」 を英語で書くと どれかな？',
    options: ['ten', 'one', 'five', 'seven'],
    correctAnswer: 'ten',
    explanation: '10は ten（テン）です。'
  },
  {
    id: 'en-g3-1',
    subject: 'english',
    grade: 3,
    questionText: '「リンゴ」を英語で書いたとき、正しいつづりはどれかな？',
    options: ['apple', 'aple', 'aplle', 'appple'],
    correctAnswer: 'apple',
    explanation: 'りんごは apple と書きます。'
  },
  {
    id: 'en-g3-2',
    subject: 'english',
    grade: 3,
    questionText: '「おはよう」のあいさつはどれかな？',
    options: ['Good morning', 'Good evening', 'Good night', 'Good bye'],
    correctAnswer: 'Good morning',
    explanation: '朝のあいさつは Good morning です。'
  },
  {
    id: 'en-g4-1',
    subject: 'english',
    grade: 4,
    questionText: '「日曜日の曜日」を英語で書くとどれかな？',
    options: ['Sunday', 'Monday', 'Friday', 'Saturday'],
    correctAnswer: 'Sunday',
    explanation: '日曜日は Sunday です。'
  },
  {
    id: 'en-g4-2',
    subject: 'english',
    grade: 4,
    questionText: '「私はサッカーが好きです」を英語で表すとどれかな？',
    options: ['I like soccer.', 'I play soccer.', 'I have soccer.', 'I am soccer.'],
    correctAnswer: 'I like soccer.',
    explanation: '「〜が好きです」は I like 〜 を使います。'
  },
  {
    id: 'en-g5-1',
    subject: 'english',
    grade: 5,
    questionText: '「これ」を指す英語はどれかな？',
    options: ['this', 'that', 'they', 'what'],
    correctAnswer: 'this',
    explanation: '近くにあるものを指す「これ」は this です。'
  },
  {
    id: 'en-g5-2',
    subject: 'english',
    grade: 5,
    questionText: '「あなたのお名前は何ですか？」とたずねるフレーズはどれかな？',
    options: ['What is your name?', 'How are you?', 'Where do you live?', 'How old are you?'],
    correctAnswer: 'What is your name?',
    explanation: '名前を聞くときは What is your name? を使います。'
  },
  {
    id: 'en-g6-1',
    subject: 'english',
    grade: 6,
    questionText: '「何時ですか？」と時間をたずねるフレーズはどれかな？',
    options: ['What time is it?', 'How old are you?', 'Where are you from?', 'What do you want?'],
    correctAnswer: 'What time is it?',
    explanation: '時間を聞く時は What time is it? を使います。'
  },
  {
    id: 'en-g6-2',
    subject: 'english',
    grade: 6,
    questionText: '「私は昨日、勉強しました」の「勉強しました（過去形）」はどれかな？',
    options: ['studied', 'study', 'studying', 'studies'],
    correctAnswer: 'studied',
    explanation: 'study の過去形は y を i に変えて ed をつけた studied です。'
  },
  {
    id: 'en-g7-1', // 中1
    subject: 'english',
    grade: 7,
    questionText: '「He」や「She」に合わせる be動詞の現在形はどれかな？',
    options: ['is', 'am', 'are', 'be'],
    correctAnswer: 'is',
    explanation: '三人称単数（He/She/It）に対するbe動詞は is です。'
  },
  {
    id: 'en-g7-2',
    subject: 'english',
    grade: 7,
    questionText: '「私は今、本を読んでいます（現在進行形）」の正しい文はどれかな？',
    options: ['I am reading a book.', 'I read a book.', 'I will read a book.', 'I was reading a book.'],
    correctAnswer: 'I am reading a book.',
    explanation: '現在進行形は [be動詞 + 動詞のing形] で表します。'
  },
  {
    id: 'en-g8-1', // 中2
    subject: 'english',
    grade: 8,
    questionText: '「私は昨日、その本を読みました」の「読みました（過去形）」のつづりはどれかな？',
    options: ['read', 'readed', 'reading', 'reads'],
    correctAnswer: 'read',
    explanation: 'read の過去形は原形と同じつづり「read」（発音はレッド）です。'
  },
  {
    id: 'en-g8-2',
    subject: 'english',
    grade: 8,
    questionText: '「〜したい」を表す [want to + 動詞の原形] の不定詞文はどれかな？',
    options: ['I want to play baseball.', 'I want playing baseball.', 'I wanted play baseball.', 'I am want baseball.'],
    correctAnswer: 'I want to play baseball.',
    explanation: '「〜したい」は want to + 動詞の原形 を使います。'
  },
  {
    id: 'en-g9-1', // 中3
    subject: 'english',
    grade: 9,
    questionText: '「私は3年間、日本に住んでいます（現在完了・継続）」の適切な表現はどれかな？',
    options: ['I have lived in Japan for 3 years.', 'I lived in Japan for 3 years.', 'I am living in Japan 3 years.', 'I live in Japan since 3 years.'],
    correctAnswer: 'I have lived in Japan for 3 years.',
    explanation: '過去から現在まで継続している状態は [have + 過去分詞] の現在完了形を使います。'
  },
  {
    id: 'en-g9-2',
    subject: 'english',
    grade: 9,
    questionText: '「この本は彼によって書かれました（受動態）」の受け身の文はどれかな？',
    options: ['This book was written by him.', 'This book wrote by him.', 'This book is write by him.', 'This book has written him.'],
    correctAnswer: 'This book was written by him.',
    explanation: '受け身（受動態）は [be動詞 + 過去分詞 + by 〜] で表します。write の過去分詞は written です。'
  },

  // ==========================================
  // 🎓 中学校 全単元・本格クイズライブラリ (追加分)
  // ==========================================

  // ---------- 中1 数学 ----------
  {
    id: 'math-g7-3',
    subject: 'math',
    grade: 7,
    questionText: '計算しなさい： (-3)² × (-2)',
    options: ['-18', '18', '-12', '12'],
    correctAnswer: '-18',
    explanation: '(-3)² = 9 です。9 × (-2) = -18 になります。'
  },
  {
    id: 'math-g7-4',
    subject: 'math',
    grade: 7,
    questionText: '半径 6cm、中心角 120° の扇形（おうぎがた）の弧の長さはどれかな？ (円周率はπ)',
    options: ['4π cm', '2π cm', '6π cm', '12π cm'],
    correctAnswer: '4π cm',
    explanation: '弧の長さ ＝ 2πr × (中心角/360) ＝ 2π × 6 × (120/360) ＝ 12π × (1/3) ＝ 4π cm です。'
  },
  {
    id: 'math-g7-5',
    subject: 'math',
    grade: 7,
    questionText: 'yがxに反比例し、x = 4 のとき y = 6 です。比例定数 a はいくらですか？',
    options: ['24', '1.5', '10', '2'],
    correctAnswer: '24',
    explanation: '反比例の式は y = a/x つまり a = xy です。a = 4 × 6 = 24 となります。'
  },

  // ---------- 中2 数学 ----------
  {
    id: 'math-g8-3',
    subject: 'math',
    grade: 8,
    questionText: '2つの直線 y = 2x - 1 と y = -x ＋ 5 の交点の座標 (x, y) はどれですか？',
    options: ['(2, 3)', '(1, 1)', '(3, 5)', '(2, 1)'],
    correctAnswer: '(2, 3)',
    explanation: '2x - 1 = -x + 5 より 3x = 6 ➔ x = 2。y = 2(2) - 1 = 3。したがって (2, 3) です。'
  },
  {
    id: 'math-g8-4',
    subject: 'math',
    grade: 8,
    questionText: '2つのサイコロを同時に投げるとき、目の和が 10 以上になる確率はどれですか？',
    options: ['1/6', '1/12', '5/36', '1/4'],
    correctAnswer: '1/6',
    explanation: '全体36通り中、和が10以上は(4,6),(5,5),(5,6),(6,4),(6,5),(6,6)の6通り。6/36 = 1/6 です。'
  },
  {
    id: 'math-g8-5',
    subject: 'math',
    grade: 8,
    questionText: '正八角形の1つの内角の大きさは何度ですか？',
    options: ['135°', '120°', '140°', '108°'],
    correctAnswer: '135°',
    explanation: '外角の和は360°なので、1つの外角は 360° ÷ 8 = 45°。内角は 180° - 45° = 135° です。'
  },

  // ---------- 中3 数学 ----------
  {
    id: 'math-g9-3',
    subject: 'math',
    grade: 9,
    questionText: '二次方程式 ax² ＋ bx ＋ c = 0 の「解の公式」として正しいものはどれですか？',
    options: [
      'x = (-b ± √(b² - 4ac)) / (2a)',
      'x = (-b ± √(b² ＋ 4ac)) / a',
      'x = (b ± √(b² - 4ac)) / (2a)',
      'x = (-b ± √(b - 4ac)) / (2a)'
    ],
    correctAnswer: 'x = (-b ± √(b² - 4ac)) / (2a)',
    explanation: '二次方程式の解の公式は x = (-b ± √(b² - 4ac)) / 2a です。'
  },
  {
    id: 'math-g9-4',
    subject: 'math',
    grade: 9,
    questionText: '関数 y = 2x² について、xの値が 1 から 3 まで増加するときの「変化の割合」はいくらですか？',
    options: ['8', '4', '16', '6'],
    correctAnswer: '8',
    explanation: 'x=1のときy=2、x=3のときy=18。変化の割合 ＝ (18 - 2)/(3 - 1) ＝ 16/2 ＝ 8 です。'
  },
  {
    id: 'math-g9-5',
    subject: 'math',
    grade: 9,
    questionText: '相似な2つの図形AとBの相似比が 2 : 3 であるとき、面積の比はいくらになりますか？',
    options: ['4 : 9', '2 : 3', '8 : 27', '4 : 6'],
    correctAnswer: '4 : 9',
    explanation: '相似比が a : b のとき、面積の比は a² : b² になるため 2² : 3² = 4 : 9 です。'
  },

  // ---------- 中1〜中3 国語 ----------
  {
    id: 'jp-g7-3',
    subject: 'japanese',
    grade: 7,
    questionText: '単語の中で、それ単独で意味がわかり文節の先頭になれる単語を何というか？',
    options: ['自立語（じりつご）', '付属語（ふぞくご）', '活用語', '体言'],
    correctAnswer: '自立語（じりつご）',
    explanation: '単独で文節を作ることができる単語を「自立語」（名詞・動詞など）といいます。'
  },
  {
    id: 'jp-g8-3',
    subject: 'japanese',
    grade: 8,
    questionText: '動詞「書く」の活用形のうち、「書かない」の「書か」はどの活用形かな？',
    options: ['未然形（みぜんけい）', '連用形', '終止形', '連体形'],
    correctAnswer: '未然形（みぜんけい）',
    explanation: '「ない」「う」に続く形を未然形といいます。'
  },
  {
    id: 'jp-g9-3',
    subject: 'japanese',
    grade: 9,
    questionText: '「温故知新」のように、昔の出来事や故事に基づいてできた言葉を何というか？',
    options: ['故事成語（こじせいご）', '対義語', '類義語', 'ことわざ'],
    correctAnswer: '故事成語（こじせいご）',
    explanation: '中国の古い出来事や伝説から生まれた言葉を故事成語といいます。'
  },
  {
    id: 'jp-g9-4',
    subject: 'japanese',
    grade: 9,
    questionText: '漢文の「返り点」で、レ点と一二点が重なったときに読む順番ルールはどれかな？',
    options: ['レ点を先に読んでから一二点に従う', '一二点を先に読む', '上から順番に読む', 'どちらから読んでも良い'],
    correctAnswer: 'レ点を先に読んでから一二点に従う',
    explanation: '一返点とレ点が重なった「一レ点」などは、レ点を優先して一コマ戻り、その後一二点に従います。'
  },

  // ---------- 中1〜中3 理科 ----------
  {
    id: 'sc-g7-3',
    subject: 'science',
    grade: 7,
    questionText: '光が空気中から水に入るとき、境界面で光が折れ曲がる現象を何というか？',
    options: ['屈折（くっせつ）', '反射', '全反射', '拡散'],
    correctAnswer: '屈折（くっせつ）',
    explanation: '光が異なる物質の境界面で進む向きを変えることを屈折といいます。'
  },
  {
    id: 'sc-g7-4',
    subject: 'science',
    grade: 7,
    questionText: '地震が発生したとき、最初に届く小さな揺れ（初期微動）を引き起こす波はどれかな？',
    options: ['P波（主要波より速い波）', 'S波（遅い波）', '表面波', '津波'],
    correctAnswer: 'P波（主要波より速い波）',
    explanation: '伝わるスピードが速い縦波（P波）が初期微動を起こします。'
  },
  {
    id: 'sc-g8-3',
    subject: 'science',
    grade: 8,
    questionText: '回路の電圧V、電流I、抵抗Rの関係を表す「オームの法則」の正しい式はどれかな？',
    options: ['V ＝ I × R', 'V ＝ I ÷ R', 'R ＝ V × I', 'I ＝ V × R'],
    correctAnswer: 'V ＝ I × R',
    explanation: '電圧(V) ＝ 電流(I) × 抵抗(R) です。'
  },
  {
    id: 'sc-g8-4',
    subject: 'science',
    grade: 8,
    questionText: 'デンプンを麦芽糖に分解する「唾液（だえき）」に含まれる消化酵素はどれかな？',
    options: ['アミラーゼ', 'ペプシン', 'トリプシン', 'リパーゼ'],
    correctAnswer: 'アミラーゼ',
    explanation: '唾液に含まれる消化酵素アミラーゼはデンプンを分解します。'
  },
  {
    id: 'sc-g9-3',
    subject: 'science',
    grade: 9,
    questionText: '塩酸（HCl）と水酸化ナトリウム（NaOH）を混ぜ合わせたとき、できる「塩（えん）」はどれかな？',
    options: ['塩化ナトリウム（NaCl）', '炭酸カルシウム', '硫酸バリウム', '硝酸カリウム'],
    correctAnswer: '塩化ナトリウム（NaCl）',
    explanation: 'H⁺ + OH⁻ ➔ H₂O となり、Na⁺ + Cl⁻ ➔ NaCl（塩化ナトリウム）ができます。'
  },
  {
    id: 'sc-g9-4',
    subject: 'science',
    grade: 9,
    questionText: '物体を高い場所に持ち上げたとき、その物体が蓄えるエネルギーを何というか？',
    options: ['位置エネルギー', '運動エネルギー', '化学エネルギー', '弾性エネルギー'],
    correctAnswer: '位置エネルギー',
    explanation: '高い位置にある物体が持つエネルギーを「位置エネルギー」といいます。'
  },

  // ---------- 中1〜中3 社会 ----------
  {
    id: 'so-g7-3',
    subject: 'social',
    grade: 7,
    questionText: '経度が15度離れると、時間の差（時差）は何時間生じるかな？',
    options: ['1時間', '2時間', '15時間', '12時間'],
    correctAnswer: '1時間',
    explanation: '地球は360度を24時間で1回転するため、360 ÷ 24 = 15度につき1時間の時差が生じます。'
  },
  {
    id: 'so-g7-4',
    subject: 'social',
    grade: 7,
    questionText: '645年、中大兄皇子と中臣鎌足らが蘇我氏を倒して始めた政治改革はどれかな？',
    options: ['大化の改新（たいかのかいしん）', '壬申の乱', '建武の新政', '明治維新'],
    correctAnswer: '大化の改新（たいかのかいしん）',
    explanation: '公地公民などを目指した政治改革が「大化の改新」です。'
  },
  {
    id: 'so-g8-3',
    subject: 'social',
    grade: 8,
    questionText: '1192年に源頼朝が鎌倉幕府を開き、将軍と御家人が結んだ主従関係を何というか？',
    options: ['御恩と奉公（ごおんとほうこう）', '楽市楽座', '参勤交代', '株仲間'],
    correctAnswer: '御恩と奉公（ごおんとほうこう）',
    explanation: '土地の保護（御恩）と軍役などの義務（奉公）による関係です。'
  },
  {
    id: 'so-g8-4',
    subject: 'social',
    grade: 8,
    questionText: '明治政府が地価の3%を現金で納めさせるように定めた税制改革はどれかな？',
    options: ['地租改正（ちそかいせい）', '徴兵令', '殖産興業', '富国強兵'],
    correctAnswer: '地租改正（ちそかいせい）',
    explanation: '土地の所有者に地券を発行し、地価の3%を現金で納めさせた改革です。'
  },
  {
    id: 'so-g9-3',
    subject: 'social',
    grade: 9,
    questionText: '立法権を持つ国会、行政権を持つ内閣、司法権を持つ裁判所が互いに抑制し合う仕組みは？',
    options: ['三権分立（さんけんぶんりゅう）', '議院内閣制', '地方自治', '直接民主制'],
    correctAnswer: '三権分立（さんけんぶんりゅう）',
    explanation: '権力の集中を防ぎ国民の権利を守るための「三権分立」の仕組みです。'
  },
  {
    id: 'so-g9-4',
    subject: 'social',
    grade: 9,
    questionText: '日本銀行（中央銀行）が市中銀行と国債などを売買して通貨量を調整する政策は？',
    options: ['公開市場操作（オペレーション）', '公定歩合操作', '預金準備率操作', '価格統制'],
    correctAnswer: '公開市場操作（オペレーション）',
    explanation: '日銀が金融市場で国債などを買い買い・売り買いして景気を調節する主たる手段です。'
  },

  // ---------- 中1〜中3 英語 ----------
  {
    id: 'en-g7-3',
    subject: 'english',
    grade: 7,
    questionText: '「彼女は毎日英語を勉強します」の正しい英文はどれかな？（三人称単数のs）',
    options: ['She studies English every day.', 'She study English every day.', 'She studying English every day.', 'She is study English every day.'],
    correctAnswer: 'She studies English every day.',
    explanation: '主語が She（三人称単数）で現在形の場合、動詞 study は y を i に変えて es をつけた studies になります。'
  },
  {
    id: 'en-g7-4',
    subject: 'english',
    grade: 7,
    questionText: '「あなたは放課後サッカーをすることができますか？」と許可・能力をたずねる文は？',
    options: ['Can you play soccer after school?', 'Do you can play soccer after school?', 'Are you play soccer after school?', 'Will you playing soccer after school?'],
    correctAnswer: 'Can you play soccer after school?',
    explanation: '「〜できますか」は助動詞 Can を文頭に出して Can + 主語 + 動詞の原形? とします。'
  },
  {
    id: 'en-g8-3',
    subject: 'english',
    grade: 8,
    questionText: '「富士山は日本で一番高い山です（最上級）」の正しい文はどれかな？',
    options: ['Mt. Fuji is the highest mountain in Japan.', 'Mt. Fuji is higher mountain in Japan.', 'Mt. Fuji is as high mountain as Japan.', 'Mt. Fuji is more high mountain in Japan.'],
    correctAnswer: 'Mt. Fuji is the highest mountain in Japan.',
    explanation: '最上級は [the + 描写語est + 名詞 + in/of 〜] で表します。high ➔ the highest です。'
  },
  {
    id: 'en-g8-4',
    subject: 'english',
    grade: 8,
    questionText: '「私は英語を勉強するために図書館へ行きました（不定詞・副詞的用法）」の正しい文は？',
    options: ['I went to the library to study English.', 'I went to the library study English.', 'I went to the library for studying English.', 'I went to the library studying English.'],
    correctAnswer: 'I went to the library to study English.',
    explanation: '「〜するために」という目的を表す副詞的用法は [to + 動詞の原形] を使います。'
  },
  {
    id: 'en-g9-3',
    subject: 'english',
    grade: 9,
    questionText: '「昨日親切にしてくれたその少年（関係代名詞・主格）」を表す適切な文はどれかな？',
    options: ['the boy who was kind to me yesterday', 'the boy which was kind to me yesterday', 'the boy whom was kind to me yesterday', 'the boy whose was kind to me yesterday'],
    correctAnswer: 'the boy who was kind to me yesterday',
    explanation: '先行詞が「人（the boy）」で主語の役割をする関係代名詞は who を使います。'
  },
  {
    id: 'en-g9-4',
    subject: 'english',
    grade: 9,
    questionText: '「もし私が鳥ならば、あなたのところへ飛んでいけるのに（仮定法過去）」の正しい文は？',
    options: ['If I were a bird, I could fly to you.', 'If I am a bird, I can fly to you.', 'If I was a bird, I fly to you.', 'If I have been a bird, I will fly to you.'],
    correctAnswer: 'If I were a bird, I could fly to you.',
    explanation: '現在の事実と反対の仮定を表す「仮定法過去」は [If + 主語 + 過去形(were), 主語 + could/would + 原形] を使います。'
  }
];

