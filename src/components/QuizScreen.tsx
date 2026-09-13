import React, { useState, useEffect, useRef } from 'react';
import type { Question, SessionQuestionRecord } from '../types';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';

interface QuizScreenProps {
  questions: Question[];
  onFinish: (
    correctCount: number,
    totalCount: number,
    wrongQuestionIds: string[],
    questionRecords?: SessionQuestionRecord[],
    activeDurationSeconds?: number
  ) => void;
  onCancel: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  questions,
  onFinish,
  onCancel
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 1問30秒
  const [wrongQuestionIds, setWrongQuestionIds] = useState<string[]>([]);
  
  // 連打・放置防止用ステート
  const [isDelayLocked, setIsDelayLocked] = useState(true);
  const [showFastWarning, setShowFastWarning] = useState(false);
  const [consecutiveTimeouts, setConsecutiveTimeouts] = useState(0);
  const [isPausedForInactivity, setIsPausedForInactivity] = useState(false);
  const [activeDurationSeconds, setActiveDurationSeconds] = useState<number>(0);

  const timerRef = useRef<any | null>(null);
  const lockTimerRef = useRef<any | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentQuestion = questions[currentIndex];

  // 出題時の早押しガードタイマー (800ms)
  useEffect(() => {
    setIsDelayLocked(true);
    setShowFastWarning(false);

    lockTimerRef.current = setTimeout(() => {
      setIsDelayLocked(false);
    }, 800);

    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [currentIndex]);

  // タイマー処理
  useEffect(() => {
    if (isAnswered || isPausedForInactivity) {
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

    // タブ切り替え（バックグラウンド移行）検知
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentIndex, isAnswered, isPausedForInactivity]);

  const handleTimeOut = () => {
    sound.playWrong();
    haptics.vibrateWrong();
    setSelectedAnswer(''); // 空白は不正解扱い
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: '(時間切れ・無解答)' }));
    setIsAnswered(true);
    setWrongQuestionIds((prev) => [...prev, currentQuestion.id]);

    // タイムアウトした問題は放置とみなし有効学習時間は加算しない (0秒)
    const nextTimeouts = consecutiveTimeouts + 1;
    setConsecutiveTimeouts(nextTimeouts);
    if (nextTimeouts >= 2) {
      setIsPausedForInactivity(true);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (isAnswered || isPausedForInactivity) return;

    if (isDelayLocked) {
      // 800ms 未満での早押し連打
      setShowFastWarning(true);
      setTimeout(() => setShowFastWarning(false), 2000);
      return;
    }

    // 正当な解答：有効学習時間を積算（1問あたり最大40秒キャップ）
    const spentSec = Math.min(40, Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    setActiveDurationSeconds(prev => prev + spentSec);
    setConsecutiveTimeouts(0); // 解答したため連続放置カウントをリセット

    setSelectedAnswer(option);
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: option }));
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

  const handleResumeFromInactivity = () => {
    sound.playClick();
    setConsecutiveTimeouts(0);
    setIsPausedForInactivity(false);
  };

  const handleNext = () => {
    sound.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      const updatedAnswers = { ...userAnswers };
      if (selectedAnswer !== null && updatedAnswers[currentIndex] === undefined) {
        updatedAnswers[currentIndex] = selectedAnswer;
      }
      const questionRecords: SessionQuestionRecord[] = questions.map((q, idx) => {
        const ans = updatedAnswers[idx] ?? '(無解答)';
        const isCor = !wrongQuestionIds.includes(q.id) && ans === q.correctAnswer;
        return {
          questionId: q.id,
          questionText: q.questionText,
          selectedAnswer: ans,
          correctAnswer: q.correctAnswer,
          isCorrect: isCor,
          explanation: q.explanation
        };
      });
      onFinish(correctCount, questions.length, wrongQuestionIds, questionRecords, activeDurationSeconds);
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
      <div className="quiz-empty-state card fade-in" style={{ padding: '32px 20px', textAlign: 'center', margin: '24px auto', maxWidth: '480px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          問題の準備ができました
        </h3>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
          この単元の問題をすべて解き終えたか、または問題が見つかりませんでした。<br />
          別の単元を選ぶか、トップ画面からもう一度挑戦してみよう！
        </p>
        <button className="back-home-btn" onClick={onCancel} style={{ minWidth: '140px' }}>
          トップへもどる
        </button>
      </div>
    );
  }

  const progressPercentage = Math.floor(((currentIndex) / questions.length) * 100);

  return (
    <div className="quiz-screen-container">
      {/* 🍵 自動一時停止（きゅうけいちゅう）モーダル */}
      {isPausedForInactivity && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content card slide-up" style={{ textAlign: 'center', padding: '32px 24px', maxWidth: '400px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🍵</div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
              きゅうけいちゅう
            </h3>
            <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
              すこし休憩できたかな？<br />
              準備ができたら「つづける」を押して、次の問題にチャレンジしよう！
            </p>
            <button
              className="start-btn"
              onClick={handleResumeFromInactivity}
              style={{ width: '100%', padding: '14px', fontSize: '18px' }}
            >
              つづける 👉
            </button>
          </div>
        </div>
      )}

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

      {/* 早押し連打警告メッセージ */}
      {showFastWarning && (
        <div className="fast-warning-banner fade-in" style={{
          background: '#fef3c7',
          border: '1.5px solid #f59e0b',
          color: '#b45309',
          padding: '8px 16px',
          borderRadius: '12px',
          margin: '0 auto 12px auto',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>👀</span>
          <span>しっかり問題文を読んでみよう！</span>
        </div>
      )}

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
