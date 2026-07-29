import type { DailyGoal, DailyReport, Subject } from '../types';

export interface SubjectGoalSummary {
  current: number;
  target: number;
  isCompleted: boolean;
}

export const getSubjectProgressSummary = (
  goal?: DailyGoal,
  reports?: DailyReport[] | DailyReport
): Record<Subject, SubjectGoalSummary> => {
  const report = Array.isArray(reports) ? reports[0] : reports;
  const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];
  const summary: Partial<Record<Subject, SubjectGoalSummary>> = {};

  subjects.forEach(sub => {
    const breakdown = report?.subjectBreakdown?.[sub];
    const current = breakdown ? breakdown.total : 0;

    let target = 0;
    if (goal?.subjectGoals?.[sub]) {
      const g = goal.subjectGoals[sub];
      target = typeof g === 'number' ? g : (g.targetQuestions || 0);
    }

    summary[sub] = {
      current,
      target,
      isCompleted: target > 0 ? current >= target : true
    };
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

  const mode = goal.goalType || 'total_count';
  const todayTotal = report.totalQuestions !== undefined ? report.totalQuestions : (report.questionsAttempted || 0);

  // モード1: 1日の全体問題数で判定
  if (mode === 'total_count') {
    return todayTotal >= (goal.targetQuestions || 5);
  }

  // モード2: 教科ごとの目標達成で判定 (subject_specific)
  if (mode === 'subject_specific') {
    const summary = getSubjectProgressSummary(goal, report);
    const subjects: Subject[] = ['math', 'japanese', 'science', 'social', 'english'];
    
    // 設定されているすべての教科目標がクリアされているか
    let hasAnyTarget = false;
    for (const sub of subjects) {
      if (summary[sub].target > 0) {
        hasAnyTarget = true;
        if (!summary[sub].isCompleted) {
          return false;
        }
      }
    }
    // 教科目標が特になければ全体の目標問題数で判断
    if (!hasAnyTarget) {
      return todayTotal >= (goal.targetQuestions || 5);
    }
    return true;
  }

  return todayTotal >= (goal.targetQuestions || 5);
};
