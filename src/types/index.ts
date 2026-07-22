export type Subject = 'math' | 'japanese' | 'science' | 'social' | 'english';

export interface Question {
  id: string;
  subject: Subject;
  grade: number; // 1〜9 (小1〜中3)
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  visualData?: {
    type: 'fraction' | 'shape' | 'chart';
    value: any;
  };
}

export interface UserStats {
  level: number;
  exp: number;
  nextLevelExp: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null;
  unlockedBadges: string[];
  equippedAvatar: {
    base: string;
    hat: string;
    accessory: string;
    companion: string;
  };
  ownedItems: string[]; // 購入済みアイテムのIDリスト
}

// 1日のノルマ（目標）とご褒美の約束
export interface DailyGoal {
  targetQuestions: number; // 例: 5問
  targetMinutes: number;   // 例: 10分
  rewardText: string;      // 例: "ゲーム30分OK！", "お小遣い50円GET！"
}

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  grade?: number; // 1〜9 (小1〜中3) のデフォルト学年設定
  pin?: string; // 4桁のPINコード（暗証番号）によるアカウント保護
  dailyGoal?: DailyGoal; // 保護者が設定した1日のノルマ＆ご褒美
  stats: UserStats;
}

export interface ReviewItem {
  questionId: string;
  subject: Subject;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  addedAt: string;
}

export interface DailyReport {
  date: string;
  subjectMinutes: Record<Subject, number>;
  questionsAttempted: number;
  questionsCorrect: number;
}
