import React, { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface QuizScreenProps {
  questions: Question[];
  onFinish: (correctCount: number, totalCount: number, wrongQuestionIds: string[]) => void;
  onCancel: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questions,
  onFinish,
  onCancel
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 1問30秒
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  const timerRef = useRef<any | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQuestion = questions[currentIndex];

  // タイマー処理
  useEffect(() => {
    if (isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(30);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered]);

  const handleTimeOut = () => {
    sound.playWrong();
    haptics.vibrateWrong();
    setSelectedAnswer(''); // 空白は不正解扱い
    setIsAnswered(true);
    setWrongQuestionIds((prev) => [...prev, currentQuestion.id]);
  };

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correctAnswer;


    if (isCorrect) {
      sound.playCorrect();
      haptics.vibrateCorrect();
      setCorrectCount((prev) => prev + 1);
    } else {
      sound.playWrong();
      haptics.vibrateWrong();
      setWrongQuestionIds((prev) => [...prev, currentQuestion.id]);
    }
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onFinish(correctCount, questions.length, wrongQuestionIds);
    }
  };

  // 分数/図形のビジュアルレンダラー
  const renderVisualData = () => {
    if (!currentQuestion.visualData) return null;

    const { type, value } = currentQuestion.visualData;

    if (type === 'fraction') {
      const { numerator, denominator } = value;
      const radius = 60;
      const center = 75;
      const paths = [];

      for (let i = 0; i < denominator; i++) {
        const startAngle = (i * 360) / denominator - 90;
        const endAngle = ((i + 1) * 360) / denominator - 90;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArcFlag = 0;
        const isFilled = i < numerator;

        const pathData = `
          M ${center} ${center}
          L ${x1} ${y1}
          A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
          Z
        `;

        paths.push(
          <path
            key={i}
            d={pathData}
            fill={isFilled ? '#ffd166' : '#e0e0e0'}
            stroke="#ffffff"
            strokeWidth="3"
          />
        );
      }

      return (
        <div className="quiz-visual-container">
          <svg width="150" height="150" className="quiz-svg">
            {paths}
          </svg>
        </div>
      );
    }

    return null;
  };

  if (!currentQuestion) {
    return (
      <div className="quiz-empty-state">
        <p>該当する問題がみつかりませんでした。</p>
        <button className="back-home-btn" onClick={onCancel}>もどる</button>
      </div>
    );
  }

  const progressPercentage = Math.floor(((currentIndex) / questions.length) * 100);

  return (
    <div className="quiz-screen-container">
      {/* 上部プログレス＆タイマー */}
      <div className="quiz-header">
        <button className="quiz-cancel-btn" onClick={() => { sound.playClick(); onCancel(); }}>
          ✕ やめる
        </button>

        <div className="quiz-progress-section">
          <span className="quiz-progress-text">問題 {currentIndex + 1} / {questions.length}</span>
          <div className="quiz-progress-bar-bg">
            <div className="quiz-progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        <div className={`quiz-timer ${timeLeft <= 5 ? 'timer-danger' : ''}`}>
          ⏱ {timeLeft}秒
        </div>
      </div>

      {/* 問題文 */}
      <div className="quiz-body-card">
        {renderVisualData()}
        <h2 className="quiz-question-text">{currentQuestion.questionText}</h2>
      </div>

      {/* 選択肢リスト */}
      <div className="quiz-options-grid">
        {currentQuestion.options.map((option, index) => {
          let optionClass = '';
          if (isAnswered) {
            if (option === currentQuestion.correctAnswer) {
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

      {/* 回答後の解説と次の問題への進むボタン */}
      {isAnswered && (
        <div className={`quiz-explanation-card fade-in`}>
          <div className="explanation-status">
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <span className="badge-correct">🎉 だいせいかい！</span>
            ) : (
              <span className="badge-wrong">😢 ざんねん！正解は 「{currentQuestion.correctAnswer}」</span>
            )}
          </div>
          <p className="explanation-desc">{currentQuestion.explanation}</p>
          <button className="quiz-next-btn" onClick={handleNext}>
            {currentIndex + 1 < questions.length ? 'つぎの問題へ 👉' : '結果を見る 🏁'}
          </button>
        </div>
      )}
    </div>
  );
};
export default QuizScreen;
