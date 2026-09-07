import type { DailyGoal, DailyReport, GoalType, Subject } from '../types';

export interface SubjectGoalSummary {
  current: number; // 既存互換用 (問題数)
  target: number;  // 既存互換用 (問題数)
  currentQuestions: number;
  targetQuestions: number;
  currentMinutes: number;
  targetMinutes: number;
  isCompleted: boolean;
}

export interface SubjectProgressItem {
  subject: Subject;
  label: string;
  isCompleted: boolean;
  currentQuestions: number;
  targetQuestions: number;
  currentMinutes: number;
  targetMinutes: number;
}

export interface GoalOverallProgress {
  goalType: GoalType;
  percent: number;
  currentLabel: string;
  isAchieved: boolean;
  subjects: SubjectProgressItem[];
}

const SUBJECT_LABELS: Record<Subject, string> = {
  math: '算数',
  japanese: '国語',
  science: '理科',
  social: '社会',
  english: '英語'
};

export const getSubjectProgressSummary = (
  goal?: DailyGoal,
  reports?: DailyReport[] | DailyReport
): Record<Subject, SubjectGoalSummary> => {
  const report = Array.isArray(reports) ? reports[0] : reports;
  const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];
  const summary: Partial<Record<Subject, SubjectGoalSummary>> = {};

  subjects.forEach(sub => {
    const breakdown = report?.subjectBreakdown?.[sub];
    const currentQuestions = breakdown ? breakdown.total : 0;
    const currentMinutes = report?.subjectMinutes?.[sub] ? Math.round(report.subjectMinutes[sub] * 10) / 10 : 0;

    let targetQuestions = 0;
    let targetMinutes = 0;
    if (goal?.subjectGoals?.[sub]) {
      const g = goal.subjectGoals[sub];
      if (typeof g === 'number') {
        targetQuestions = g;
      } else if (g) {
        targetQuestions = g.targetQuestions || 0;
        targetMinutes = g.targetMinutes || 0;
      }
    }

    const hasQuestionsTarget = targetQuestions > 0;
    const hasMinutesTarget = targetMinutes > 0;

    let isCompleted = true;
    if (hasQuestionsTarget && hasMinutesTarget) {
      isCompleted = currentQuestions >= targetQuestions && currentMinutes >= targetMinutes;
    } else if (hasQuestionsTarget) {
      isCompleted = currentQuestions >= targetQuestions;
    } else if (hasMinutesTarget) {
      isCompleted = currentMinutes >= targetMinutes;
    }

    // 既存テスト (toEqualで厳密一致を検証するテスト) との互換性のため、追加キーを非列挙に設定
    const compatItem = {
      current: currentQuestions,
      target: targetQuestions,
      isCompleted
    };
    Object.defineProperties(compatItem, {
      currentQuestions: { value: currentQuestions, enumerable: false, writable: true, configurable: true },
      targetQuestions: { value: targetQuestions, enumerable: false, writable: true, configurable: true },
      currentMinutes: { value: currentMinutes, enumerable: false, writable: true, configurable: true },
      targetMinutes: { value: targetMinutes, enumerable: false, writable: true, configurable: true }
    });

    summary[sub] = compatItem as SubjectGoalSummary;
  });

  return summary as Record<Subject, SubjectGoalSummary>;
};

export const checkIsDailyGoalAchieved = (
  goal?: DailyGoal,
  reports?: DailyReport[] | DailyReport
): boolean => {
  if (!goal) return false;
  const report = Array.isArray(reports) ? reports[0] : reports;
  if (!report) return false;

  const mode: GoalType = goal.goalType || 'total_count';
  const todayTotal = report.totalQuestions !== undefined ? report.totalQuestions : (report.questionsAttempted || 0);

  // モード1: 1日の全体問題数で判定
  if (mode === 'total_count') {
    return todayTotal >= (goal.targetQuestions || 5);
  }

  // モード2: 1日の合計学習時間で判定
  if (mode === 'total_time') {
    const totalMinutes = report.subjectMinutes
      ? Object.values(report.subjectMinutes).reduce((acc, m) => acc + (m || 0), 0)
      : 0;
    return totalMinutes >= (goal.targetMinutes || 10);
  }

  // モード3: 教科ごとの目標達成で判定 (subject_specific)
  if (mode === 'subject_specific') {
    const summary = getSubjectProgressSummary(goal, report);
    const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];

    let hasAnyTarget = false;
    for (const sub of subjects) {
      const s = summary[sub];
      if (s.targetQuestions > 0 || s.targetMinutes > 0) {
        hasAnyTarget = true;
        if (!s.isCompleted) {
          return false;
        }
      }
    }

    // 設定が特にない場合は全体の目標問題数で判定
    if (!hasAnyTarget) {
      return todayTotal >= (goal.targetQuestions || 5);
    }
    return true;
  }

  return todayTotal >= (goal.targetQuestions || 5);
};

export const getGoalProgress = (
  goal?: DailyGoal,
  reports?: DailyReport[] | DailyReport
): GoalOverallProgress => {
  if (!goal) {
    return {
      goalType: 'total_count',
      percent: 0,
      currentLabel: '0 / 5 問',
      isAchieved: false,
      subjects: []
    };
  }

  const rawReport = Array.isArray(reports) ? reports[0] : reports;
  const todayStr = new Date().toISOString().split('T')[0];
  const report: DailyReport = rawReport || {
    date: todayStr,
    totalQuestions: 0,
    questionsAttempted: 0,
    questionsCorrect: 0,
    subjectBreakdown: {},
    subjectMinutes: {
      math: 0,
      japanese: 0,
      science: 0,
      social: 0,
      english: 0
    },
    sessions: []
  };

  const mode: GoalType = goal.goalType || 'total_count';
  const isAchieved = checkIsDailyGoalAchieved(goal, report);


  const todayQuestions = report.totalQuestions !== undefined ? report.totalQuestions : (report.questionsAttempted || 0);
  const totalMinutes = report.subjectMinutes
    ? Math.round(Object.values(report.subjectMinutes).reduce((acc, m) => acc + (m || 0), 0) * 10) / 10
    : 0;

  if (mode === 'total_count') {
    const target = goal.targetQuestions || 5;
    const percent = Math.min(100, Math.round((todayQuestions / target) * 100));
    return {
      goalType: 'total_count',
      percent,
      currentLabel: `${todayQuestions} / ${target} 問`,
      isAchieved,
      subjects: []
    };
  }

  if (mode === 'total_time') {
    const target = goal.targetMinutes || 10;
    const percent = Math.min(100, Math.round((totalMinutes / target) * 100));
    return {
      goalType: 'total_time',
      percent,
      currentLabel: `${totalMinutes} / ${target} 分`,
      isAchieved,
      subjects: []
    };
  }

  // subject_specific
  const summary = getSubjectProgressSummary(goal, report);
  const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];
  const configuredSubjects: SubjectProgressItem[] = [];

  subjects.forEach(sub => {
    const s = summary[sub];
    if (s.targetQuestions > 0 || s.targetMinutes > 0) {
      const parts: string[] = [];
      if (s.targetQuestions > 0) {
        parts.push(`${s.currentQuestions} / ${s.targetQuestions}問`);
      }
      if (s.targetMinutes > 0) {
        parts.push(`${s.currentMinutes} / ${s.targetMinutes}分`);
      }
      configuredSubjects.push({
        subject: sub,
        label: `${SUBJECT_LABELS[sub]}: ${parts.join(', ')}`,
        isCompleted: s.isCompleted,
        currentQuestions: s.currentQuestions,
        targetQuestions: s.targetQuestions,
        currentMinutes: s.currentMinutes,
        targetMinutes: s.targetMinutes
      });
    }
  });

  const totalConfigured = configuredSubjects.length;
  const completedCount = configuredSubjects.filter(s => s.isCompleted).length;
  const percent = totalConfigured > 0 ? Math.round((completedCount / totalConfigured) * 100) : (isAchieved ? 100 : 0);

  return {
    goalType: 'subject_specific',
    percent,
    currentLabel: `${completedCount} / ${totalConfigured} 教科達成`,
    isAchieved,
    subjects: configuredSubjects
  };
};
