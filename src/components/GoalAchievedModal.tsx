import React from 'react';
import type { UserProfile } from '../types';
import { sound } from '../utils/sound';
import { getEffectiveDailyGoal } from '../utils/goalEvaluator';

interface GoalAchievedModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const GoalAchievedModal: React.FC<GoalAchievedModalProps> = ({ profile, onClose }) => {
  const goal = getEffectiveDailyGoal(profile);
  const goalDesc = goal.goalType === 'total_time'
    ? `${goal.targetMinutes || 10}分クリア`
    : goal.goalType === 'subject_specific'
      ? '教科別ノルマクリア'
      : `${goal.targetQuestions || 5}問クリア`;

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content goal-achieved-modal slide-up">
        <div className="goal-achieved-header">
          <span className="party-emoji">🎉</span>
          <h2>きょうのノルマ達成！おめでとう！</h2>
          <span className="party-emoji">✨</span>
        </div>

        <p className="goal-achieved-desc">
          <strong>{profile.name} さん</strong>、きょうの目標（{goalDesc}）を見ごとに達成したよ！
        </p>

        {/* ご褒美約束カード */}
        <div className="reward-card">
          <div className="reward-card-label">🎁 おうちの人とのご褒美（約束）</div>
          <div className="reward-card-text">{goal.rewardText}</div>
          <p className="reward-card-hint">画面をおうちの人に見せて、ご褒美をもらおう！</p>
        </div>

        <button className="start-btn goal-ok-btn" onClick={handleClose}>
          やったー！冒険をつづける 🚀
        </button>
      </div>
    </div>
  );
};
export default GoalAchievedModal;
