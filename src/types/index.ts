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

export type GoalType = 'total_count' | 'total_time' | 'subject_specific';

export interface SubjectGoal {
  targetQuestions: number; // 例: 5問 (0は目標なし)
  targetMinutes: number;   // 例: 10分 (0は目標なし)
}

// 1日のノルマ（目標）とご褒美の約束
export interface DailyGoal {
  targetQuestions: number; // 例: 5問
  targetMinutes: number;   // 例: 10分
  rewardText: string;      // 例: "ゲーム30分OK！", "お小遣い50円GET！"
  goalType?: GoalType;     // 🎯 ノルマ達成の判定基準モード ('total_count': 全体問題数, 'total_time': 全体時間, 'subject_specific': 教科ごと)
  targetSubject?: Subject | 'all'; // 特定対象科目
  targetUnitName?: string | 'all'; // 特定対象単元名
  subjectGoals?: Partial<Record<Subject, SubjectGoal>>; // 教科別個別の目標
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface WeeklySchedule {
  enabled: boolean; // 曜日別スケジュールが有効か
  days?: Partial<Record<DayOfWeek, DailyGoal>>; // 曜日ごとの個別DailyGoal
}

export type SemesterSystem = '3-term' | '2-term';

export interface UserProfile {
  id: string;
  name: string;
  avatarEmoji: string;
  birthDate?: string; // 生年月日 YYYY-MM-DD (例: "2017-05-15")
  grade?: number; // 1〜9 (小1〜中3) のデフォルト学年設定
  pin?: string; // 4桁のPINコード（暗証番号）によるアカウント保護
  semesterSystem?: SemesterSystem; // 学期制設定 ('3-term' | '2-term')
  dailyGoal?: DailyGoal; // 保護者が設定した1日のノルマ＆ご褒美
  weeklySchedule?: WeeklySchedule; // 曜日別スケジュール設定
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

export interface SessionQuestionRecord {
  questionId: string;
  questionText: string;
  selectedAnswer: string;  // お子様が選んだ解答
  correctAnswer: string;   // 正解
  isCorrect: boolean;      // 正誤判定 (true: ◯, false: ✕)
  explanation: string;     // 解説
}

export interface QuizSession {
  id?: string;             // セッションID
  subject: Subject;
  grade?: number;          // 解いた問題の学年 (1〜9)
  unitName?: string;       // 単元名 (例:「大きな数」「全般（ランダム）」)
  sessionType?: 'quiz' | 'exam'; // クイズ(5問) または 単元確認テスト(10問)
  questionsAttempted: number;
  questionsCorrect: number;
  durationMinutes: number;
  durationSeconds?: number;// 正確な秒数
  timestamp: string;
  questionRecords?: SessionQuestionRecord[]; // 各問題の詳細履歴
}

export interface DailyReport {
  date: string;
  subjectMinutes: Record<Subject, number>;
  questionsAttempted: number;
  questionsCorrect: number;
  totalQuestions?: number;
  subjectBreakdown?: Partial<Record<Subject, { total: number; correct?: number }>>;
  sessions?: QuizSession[];
}

// 🧠 間隔反復記憶法 (Spaced Repetition System: SRS) の学習ステータス
export interface QuestionSRSItem {
  questionKey: string;      // 問題のユニーク識別キー (questionId または問題テキストの正規化キー)
  questionId: string;       // 問題ID
  subject: Subject;         // 教科
  grade: number;            // 学年
  unitName?: string;        // 単元名
  stage: number;            // 0: 未着手/再学習, 1: 1週間後, 2: 4週間後, 3: 1ヶ月後, 4: 完全習得(Mastered)
  lastAttemptedAt: string;  // 最後に解いた日時 (YYYY-MM-DD)
  nextAvailableAt: string;  // 次に出題可能になる日 (YYYY-MM-DD)
  intervalDays: number;     // 現在の間隔日数 (0, 7, 28, 30)
  isMastered: boolean;      // 完全習得（ノルマには今後表示しない）
  correctStreak: number;    // 連続正解回数
  totalAttempts: number;    // 累計解答回数
  totalCorrect: number;     // 累計正解回数
}

export interface SRSStats {
  masteredCount: number;     // 完全マスターした問題数
  inProgressCount: number;   // 学習中（Stage 1〜3）の問題数
  dueTodayCount: number;     // 今日復習期日を迎えた問題数
  coolingDownCount: number;  // クールダウン中（次回待ち）の問題数
  stageBreakdown: Record<number, number>; // ステージ別内訳
}
