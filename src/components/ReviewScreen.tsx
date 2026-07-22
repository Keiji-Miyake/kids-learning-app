import React, { useState, useEffect } from 'react';
import type { ReviewItem, Subject } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface ReviewScreenProps {
  onClose: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ onClose }) => {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);


  useEffect(() => {
    // 苦手問題のロード
    setReviewItems(storage.getReviewItems());
  }, []);

  const currentItem = reviewItems[currentIndex];

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    const isCorrect = option === currentItem.correctAnswer;

    if (isCorrect) {
      sound.playCorrect();
      haptics.vibrateCorrect();
      // にがて克服成功：LocalStorage から削除
      storage.removeReviewItem(currentItem.questionId);
    } else {
      sound.playWrong();
      haptics.vibrateWrong();
    }
  };

  const handleNext = () => {
    sound.playClick();
    setSelectedAnswer(null);
    setIsAnswered(false);

    // 最新のリストを取得して次に進む
    const updatedItems = storage.getReviewItems();
    setReviewItems(updatedItems);
    
    // インデックス調整（削除された場合は同じインデックスを指す）
    if (currentIndex >= updatedItems.length) {
      setCurrentIndex(0);
    }
  };

  const getSubjectEmoji = (sub: Subject) => {
    switch (sub) {
      case 'math': return '🧮 算数';
      case 'japanese': return '📖 国語';
      case 'science': return '🧪 理科';
      case 'social': return '🗺 社会';
      case 'english': return '🔤 英語';
    }
  };

  return (
    <div className="review-screen-container fade-in">
      <div className="review-header">
        <h2 className="review-title">📝 にがて克服ノート</h2>
        <span className="review-badge-count">のこり {reviewItems.length} 問</span>
      </div>

      {reviewItems.length === 0 ? (
        <div className="review-empty-state card">
          <span className="empty-emoji">🌟</span>
          <h3>すべての「にがて」を克服したよ！</h3>
          <p>とってもすばらしい！この調子で新しい問題にもどんどん挑戦しよう！</p>
          <button className="back-home-btn" onClick={() => { sound.playClick(); onClose(); }}>
            メニューにもどる 🏠
          </button>
        </div>
      ) : (
        <div className="review-quiz-body">
          {/* 問題カード */}
          <div className="quiz-body-card">
            <span className="review-subject-tag">{getSubjectEmoji(currentItem.subject)}</span>
            <h2 className="quiz-question-text">{currentItem.questionText}</h2>
          </div>

          {/* 選択肢 */}
          <div className="quiz-options-grid">
            {currentItem.options.map((option, index) => {
              let optionClass = '';
              if (isAnswered) {
                if (option === currentItem.correctAnswer) {
                  optionClass = 'option-correct-reveal';
                } else if (option === selectedAnswer) {
                  optionClass = 'option-incorrect-reveal';
                } else {
                  optionClass = 'option-disabled';
                }
              }

              return (
                <button
                  key={index}
                  className={`quiz-option-btn ${optionClass} ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={isAnswered}
                >
                  <span className="option-num">{index + 1}</span>
                  <span className="option-text">{option}</span>
                </button>
              );
            })}
          </div>

          {/* 解説表示 */}
          {isAnswered && (
            <div className="quiz-explanation-card fade-in">
              <div className="explanation-status">
                {selectedAnswer === currentItem.correctAnswer ? (
                  <span className="badge-correct">🎉 克服成功！ノートから消えたよ！</span>
                ) : (
                  <span className="badge-wrong">😢 次はがんばろう！正解は 「{currentItem.correctAnswer}」</span>
                )}
              </div>
              <p className="explanation-desc">{currentItem.explanation}</p>
              <button className="quiz-next-btn" onClick={handleNext}>
                つぎの復習問題へ 👉
              </button>
            </div>
          )}

          <div className="review-actions">
            <button className="cancel-btn" onClick={() => { sound.playClick(); onClose(); }}>
              復習をおわる 🏠
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReviewScreen;
