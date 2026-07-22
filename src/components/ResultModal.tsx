import React, { useEffect, useRef } from 'react';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';
import { ConfettiEffect } from '../utils/confetti';
import { storage } from '../utils/storage';
import type { UserStats } from '../types';

interface ResultModalProps {
  correctCount: number;
  totalCount: number;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onClose: () => void;
  onRetry?: () => void; // 新しい問題で再挑戦
}

export const ResultModal: React.FC<ResultModalProps> = ({
  correctCount,
  totalCount,
  stats,
  onUpdateStats,
  onClose,
  onRetry
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<ConfettiEffect | null>(null);
  const [levelUpOccurred, setLevelUpOccurred] = React.useState(false);
  const [earnedCoins, setEarnedCoins] = React.useState(0);
  const [earnedExp, setEarnedExp] = React.useState(0);

  useEffect(() => {
    const correctRatio = correctCount / totalCount;
    const baseExp = correctCount * 20;
    const perfBonusExp = correctRatio === 1 ? 50 : 0;
    const finalExp = baseExp + perfBonusExp;

    const baseCoins = correctCount * 5;
    const perfBonusCoins = correctRatio === 1 ? 25 : 0;
    const finalCoins = baseCoins + perfBonusCoins;

    setEarnedExp(finalExp);
    setEarnedCoins(finalCoins);

    let newLevel = stats.level;
    let newExp = stats.exp + finalExp;
    let newNextLevelExp = stats.nextLevelExp;
    let lvUp = false;

    while (newExp >= newNextLevelExp) {
      newExp -= newNextLevelExp;
      newLevel += 1;
      newNextLevelExp = Math.floor(newNextLevelExp * 1.2);
      lvUp = true;
    }

    setLevelUpOccurred(lvUp);

    const updatedBadges = [...stats.unlockedBadges];
    if (!updatedBadges.includes('badge-first-step')) {
      updatedBadges.push('badge-first-step');
    }
    if (correctRatio === 1 && !updatedBadges.includes('badge-all-correct')) {
      updatedBadges.push('badge-all-correct');
    }
    if (newLevel >= 5 && !updatedBadges.includes('badge-level-5')) {
      updatedBadges.push('badge-level-5');
    }
    const newCoinsTotal = stats.coins + finalCoins;
    if (newCoinsTotal >= 300 && !updatedBadges.includes('badge-rich')) {
      updatedBadges.push('badge-rich');
    }

    const updatedStats: UserStats = {
      ...stats,
      level: newLevel,
      exp: newExp,
      nextLevelExp: newNextLevelExp,
      coins: newCoinsTotal,
      unlockedBadges: updatedBadges
    };

    onUpdateStats(updatedStats);
    storage.saveStats(updatedStats);

    if (lvUp) {
      sound.playLevelUp();
      haptics.vibrateLevelUp();
    } else {
      if (correctCount > 0) {
        sound.playCorrect();
        haptics.vibrateCorrect();
      } else {
        sound.playWrong();
      }
    }

    if (canvasRef.current) {
      confettiRef.current = new ConfettiEffect(canvasRef.current);
      confettiRef.current.start(4000);
    }

    return () => {
      if (confettiRef.current) {
        confettiRef.current.destroy();
      }
    };
  }, [correctCount, totalCount]);

  const scorePercentage = Math.floor((correctCount / totalCount) * 100);

  return (
    <div className="result-modal-overlay">
      <canvas ref={canvasRef} className="result-confetti-canvas" />

      <div className="result-card bounce-in">
        <h2 className="result-title">学習リザルト</h2>

        <div className="score-circle-container">
          <div className="score-circle" style={{ borderColor: scorePercentage >= 80 ? '#33cc66' : '#ff9933' }}>
            <span className="score-num">{scorePercentage}</span>
            <span className="score-unit">%</span>
          </div>
          <p className="score-details">
            {totalCount}問中 {correctCount}問正解！
          </p>
        </div>

        {levelUpOccurred && (
          <div className="level-up-banner pulse">
            <h3>🎉 レベルアップ！ 🎉</h3>
            <p>プレイヤーレベルが <strong>Lv.{stats.level}</strong> に上がった！</p>
          </div>
        )}

        <div className="rewards-container">
          <h4 className="rewards-title">手に入れた宝物</h4>
          <div className="rewards-grid">
            <div className="reward-item">
              <span className="reward-emoji">✨</span>
              <div className="reward-info">
                <span className="reward-value">+{earnedExp}</span>
                <span className="reward-label">けいけんち</span>
              </div>
            </div>
            <div className="reward-item">
              <span className="reward-emoji">🪙</span>
              <div className="reward-info">
                <span className="reward-value">+{earnedCoins}</span>
                <span className="reward-label">コイン</span>
              </div>
            </div>
          </div>
        </div>

        <div className="result-actions" style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '16px' }}>
          {onRetry && (
            <button 
              className="start-btn" 
              style={{ flex: 1, padding: '14px', fontSize: '15px' }} 
              onClick={() => { sound.playClick(); onRetry(); }}
            >
              新しい問題に挑戦 🔄
            </button>
          )}
          <button 
            className="finish-btn" 
            style={{ flex: 1, padding: '14px', fontSize: '15px' }} 
            onClick={() => { sound.playClick(); onClose(); }}
          >
            メニューにもどる 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
export default ResultModal;
