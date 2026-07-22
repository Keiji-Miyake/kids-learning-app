import React from 'react';
import type { UserProfile } from '../types';
import { sound } from '../utils/sound';

interface GoalAchievedModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const GoalAchievedModal: React.FC<GoalAchievedModalProps> = ({ profile, onClose }) => {
  const goal = profile.dailyGoal || {
    targetQuestions: 5,
    targetMinutes: 10,
    rewardText: '🎮 ゲーム30分OK！'
  };

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
          <strong>{profile.name} さん</strong>、きょうの目標（{goal.targetQuestions}問クリア）を見ごとに達成したよ！
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
