import React, { useState, useEffect } from 'react';

import type { Question, Subject, UserProfile, SessionQuestionRecord } from '../types';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';
import { markUnitCompleted } from '../data/progress';
import { storage } from '../utils/storage';

export interface ExamResult {
  score: number;
  maxScore: number;
  percentage: number;
  rank: 'S' | 'A' | 'B' | 'C';
  passed: boolean;
  deviationScore: number; // 疑似偏差値 (50〜75)
}

export const calculateExamResult = (correctCount: number, totalCount: number): ExamResult => {
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  let rank: 'S' | 'A' | 'B' | 'C' = 'C';
  let passed = false;

  if (percentage >= 90) {
    rank = 'S';
    passed = true;
  } else if (percentage >= 70) {
    rank = 'A';
    passed = true;
  } else if (percentage >= 50) {
    rank = 'B';
    passed = false;
  } else {
    rank = 'C';
    passed = false;
  }

  const deviationScore = Math.min(75, Math.max(35, Math.round(35 + (percentage * 0.4))));

  return {
    score: correctCount,
    maxScore: totalCount,
    percentage,
    rank,
    passed,
    deviationScore
  };
};

interface ExamScreenProps {
  profile: UserProfile;
  subject: Subject;
  grade: number;
  unitName: string;
  unitCode?: string;
  questions: Question[];
  onFinish: (result: ExamResult) => void;
  onCancel: () => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  profile,
  subject,
  grade,
  unitName,
  unitCode,
  questions,
  onFinish,
  onCancel
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10分 (600秒)
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSelectOption = (option: string) => {
    sound.playClick();
    setUserAnswers(prev => ({ ...prev, [currentIndex]: option }));
  };

  const handleSubmitExam = () => {
    sound.playCorrect();
    haptics.vibrateCorrect();

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const result = calculateExamResult(correctCount, questions.length);
    setExamResult(result);
    setIsSubmitted(true);

    // 📝 学習レポートに単元確認テストのセッションと問題詳細を保存
    const timeSpentSeconds = Math.max(1, 600 - timeLeft);
    const questionRecords: SessionQuestionRecord[] = questions.map((q, idx) => {
      const userAns = userAnswers[idx] ?? '(無解答)';
      const isCor = userAns === q.correctAnswer;
      return {
        questionId: q.id,
        questionText: q.questionText,
        selectedAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect: isCor,
        explanation: q.explanation
      };
    });

    storage.addReportData(subject, correctCount, timeSpentSeconds, profile.id, questions.length, {
      unitName,
      sessionType: 'exam',
      questionRecords
    });

    if (result.passed && unitCode) {
      markUnitCompleted(profile.id, unitCode);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getSubjectName = (sub: Subject) => {
    switch (sub) {
      case 'math': return '算数・数学';
      case 'japanese': return '国語';
      case 'science': return '理科';
      case 'social': return '社会';
      case 'english': return '英語';
    }
  };

  return (
    <div className="exam-screen-container fade-in">
      {!isSubmitted ? (
        <div className="exam-card card">
          {/* テストヘッダー */}
          <div className="exam-header">
            <div className="exam-badge-tag">📝 単元確認テスト・定期テスト</div>
            <div className="exam-timer">⏱️ のこり時間: <strong>{formatTime(timeLeft)}</strong></div>
            <button className="quiz-cancel-btn" onClick={onCancel}>✕ ちゅうだん</button>
          </div>

          <div className="exam-info-bar">
            <span>対象: <strong>{getSubjectName(subject)} （小/中{grade}年）</strong></span>
            <span>単元: <strong>{unitName}</strong></span>
            <span>問題 {currentIndex + 1} / {questions.length}</span>
          </div>

          {/* 問題本文 */}
          <div className="quiz-body-card">
            <h3 className="quiz-question-text">{currentQuestion.questionText}</h3>
          </div>

          {/* 選択肢リスト */}
          <div className="quiz-options-grid">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswers[currentIndex] === option;
              return (
                <button
                  key={index}
                  className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(option)}
                >
                  <span className="option-num">{index + 1}</span>
                  <span className="option-text">{option}</span>
                </button>
              );
            })}
          </div>

          {/* ナビゲーションコントロール */}
          <div className="exam-nav-controls">
            <button
              className="quiz-cancel-btn"
              disabled={currentIndex === 0}
              onClick={() => { sound.playClick(); setCurrentIndex(prev => prev - 1); }}
            >
              ◀ 前の問題
            </button>

            {currentIndex + 1 < questions.length ? (
              <button
                className="quiz-next-btn"
                onClick={() => { sound.playClick(); setCurrentIndex(prev => prev + 1); }}
              >
                次の問題 ▶
              </button>
            ) : (
              <button
                className="start-btn submit-exam-btn"
                onClick={handleSubmitExam}
              >
                🏁 テストを提出して採点する
              </button>
            )}
          </div>
        </div>
      ) : (
        /* テスト成績発表シート */
        <div className="exam-result-card card fade-in">
          <div className="exam-result-header">
            <span className="exam-result-emoji">📜</span>
            <h2>単元確認テスト 採点成績表</h2>
            <p>{unitName}</p>
          </div>

          <div className={`rank-badge-large rank-${examResult?.rank}`}>
            評価ランク: <strong>{examResult?.rank}</strong>
          </div>

          <div className="exam-stats-grid">
            <div className="stat-box">
              <span className="stat-label">得点</span>
              <span className="stat-val">{examResult?.score} / {examResult?.maxScore} 問正解</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">正解率</span>
              <span className="stat-val">{examResult?.percentage}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">判定結果</span>
              <span className={`stat-val ${examResult?.passed ? 'text-success' : 'text-danger'}`}>
                {examResult?.passed ? '🎉 合格！単元マスター！' : '😢 不合格（要復習）'}
              </span>
            </div>
          </div>

          <div className="exam-result-footer">
            <button
              className="start-btn"
              onClick={() => examResult && onFinish(examResult)}
            >
              テスト結果を閉じてロードマップへ 🏠
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExamScreen;
