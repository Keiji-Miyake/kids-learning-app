export interface ShopItem {
  id: string;
  name: string;
  category: 'base' | 'hat' | 'accessory' | 'companion';
  price: number;
  emoji: string;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requirement: string;
}

export const shopItems: ShopItem[] = [
  // ベースキャラクター
  { id: 'base-boy', name: '元気な少年', category: 'base', price: 0, emoji: '👦', description: '初期アバター。元気いっぱいの男の子スタイル。' },
  { id: 'base-girl', name: '活発な少女', category: 'base', price: 0, emoji: '👧', description: '初期アバター。笑顔がすてきな女の子スタイル。' },
  { id: 'base-robot', name: 'お助けロボ', category: 'base', price: 100, emoji: '🤖', description: 'きらきら光る学習アシスタントロボット。' },
  { id: 'base-cat', name: 'もの知りネコ', category: 'base', price: 150, emoji: '🐱', description: '人間の言葉がわかる、お利口なねこちゃん。' },
  { id: 'base-ninja', name: 'スピード忍者', category: 'base', price: 180, emoji: '🥷', description: '素早く問題を解決する頼もしい忍者。' },

  // 帽子
  { id: 'hat-none', name: '帽子なし', category: 'hat', price: 0, emoji: '❌', description: '帽子をかぶらないスタイル。' },
  { id: 'hat-cap', name: 'アドベンチャーキャップ', category: 'hat', price: 30, emoji: '🧢', description: '冒険にぴったりな青いキャップ。' },
  { id: 'hat-crown', name: 'ゴールドクラウン', category: 'hat', price: 200, emoji: '👑', description: '全問正解者にふさわしい、きらめく王冠。' },
  { id: 'hat-grad', name: 'はかせのぼうし', category: 'hat', price: 120, emoji: '🎓', description: '頭がよさそうに見えるアカデミックキャップ。' },

  // アクセサリー
  { id: 'acc-none', name: 'アクセサリーなし', category: 'accessory', price: 0, emoji: '❌', description: 'シンプルな姿。' },
  { id: 'acc-glasses', name: 'インテリめがね', category: 'accessory', price: 50, emoji: '👓', description: 'かけるだけで集中力がアップしそうな丸メガネ。' },
  { id: 'acc-star', name: 'きらきらスター', category: 'accessory', price: 80, emoji: '⭐', description: '体からあふれ出るやる気の光。' },
  { id: 'acc-medal', name: 'ゴールドメダル', category: 'accessory', price: 150, emoji: '🏅', description: '胸元に輝く努力の証。' },

  // 相棒モンスター
  { id: 'comp-none', name: '相棒なし', category: 'companion', price: 0, emoji: '❌', description: 'ひとりで挑戦する。' },
  { id: 'comp-dragon', name: 'ちびドラゴン', category: 'companion', price: 250, emoji: '🐉', description: '小さな火を吹く、頼もしいドラゴンの赤ちゃん。' },
  { id: 'comp-slime', name: 'ぷるぷるスライム', category: 'companion', price: 80, emoji: '💧', description: 'いつも楽しそうに飛び跳ねているスライム。' },
  { id: 'comp-owl', name: '知恵のフクロウ', category: 'companion', price: 180, emoji: '🦉', description: '難しい問題のとき、そっと応援してくれるフクロウ。' }
];

export const badges: Badge[] = [
  { id: 'badge-first-step', name: 'はじめの一歩', emoji: '👣', description: 'クイズを初めて1回クリアした', requirement: '1回クリア' },
  { id: 'badge-math-master', name: '算数の達人', emoji: '🧮', description: '算数のクイズで合計5問正解した', requirement: '算数5問正解' },
  { id: 'badge-all-correct', name: 'パーフェクト', emoji: '💯', description: 'クイズで全問正解を達成した', requirement: '全問正解でクリア' },
  { id: 'badge-rich', name: 'コインコレクター', emoji: '💰', description: '累計で300コイン以上獲得した', requirement: '300コイン獲得' },
  { id: 'badge-level-5', name: 'かけだし冒険者', emoji: '🌟', description: 'プレイヤーレベルが5に達した', requirement: 'レベル5到達' }
];
