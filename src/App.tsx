import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SubjectCard from './components/SubjectCard';
import QuizScreen from './components/QuizScreen';
import ResultModal from './components/ResultModal';
import ShopModal from './components/ShopModal';
import CollectionScreen from './components/CollectionScreen';
import ReviewScreen from './components/ReviewScreen';
import { ParentDashboard } from './components/ParentDashboard';
import { ProfileSelectorModal } from './components/ProfileSelectorModal';
import { GoalAchievedModal } from './components/GoalAchievedModal';
import AvatarPreview from './components/AvatarPreview';

import { questions } from './data/questions';
import type { UserStats, Subject, Question, UserProfile } from './types';
import { storage } from './utils/storage';

import { generateDynamicQuestion } from './utils/questionGenerator';
import { RoadmapScreen } from './components/RoadmapScreen';
import ExamScreen from './components/ExamScreen';

import type { CurriculumUnit } from './data/curriculumLOD';
import { markUnitCompleted } from './data/progress';


export const App: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState<UserProfile>(storage.getActiveProfile());
  const [stats, setStats] = useState<UserStats>(storage.getStats(activeProfile.id));
  const [currentScreen, setCurrentScreen] = useState<string>('home'); // home | quiz | result | shop | collection | review | dashboard
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showGoalAchievedModal, setShowGoalAchievedModal] = useState<boolean>(false);
  const [gridCols, setGridCols] = useState<'auto' | 'cols-2' | 'cols-3'>('cols-3');

  // クイズ用ステート
  const [activeSubject, setActiveSubject] = useState<Subject>('math');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  // リザルト用ステート
  const [quizResults, setQuizResults] = useState<{
    correctCount: number;
    totalCount: number;
    wrongQuestionIds: string[];
  } | null>(null);

  // 起動時・タブフォーカス時・定期自動同期
  useEffect(() => {
    let isMounted = true;

    const syncAndRefresh = async () => {
      try {
        await storage.syncFromServer();
        if (!isMounted) return;
        const currentActive = storage.getActiveProfile();
        setActiveProfile(currentActive);
        const updatedStreak = storage.checkAndUpdateStreak(currentActive.id);
        setStats({ ...storage.getStats(currentActive.id), streak: updatedStreak });
      } catch (err) {
        console.warn("Background sync failed:", err);
      }
    };

    // 初期化同期
    syncAndRefresh();

    // タブ復帰（フォーカス）時の自動同期
    const handleFocus = () => {
      syncAndRefresh();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAndRefresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 15秒間隔の定期バックグラウンド同期タイマー
    const timerId = setInterval(() => {
      syncAndRefresh();
    }, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timerId);
    };
  }, []);

  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    const updatedStreak = storage.checkAndUpdateStreak(profile.id);
    setStats({ ...storage.getStats(profile.id), streak: updatedStreak });
    setShowProfileModal(false);
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setShowProfileModal(true);
  };


  // クイズで直前に解いた問題のIDキャッシュ (被り防止)
  const [recentQuestionIds, setRecentQuestionIds] = useState<string[]>([]);
  const [activeUnit, setActiveUnit] = useState<CurriculumUnit | undefined>(undefined);

  const handleSelectSubject = (subject: Subject, grade: number, unit?: CurriculumUnit) => {
    setActiveUnit(unit);
    const unitName = unit ? unit.unitName : '';

    // 選択された教科・学年・単元に完全に連動した動的問題を5問生成
    const dynQuestions: Question[] = [];
    for (let i = 0; i < 5; i++) {
      dynQuestions.push(generateDynamicQuestion(subject, grade, unitName));
    }

    const subjectQuestions = questions.filter(q => q.subject === subject);
    let targetQuestions = subjectQuestions.filter(q => q.grade === grade);

    // 単元名で優先フィルタリング
    if (unitName) {
      const unitFiltered = targetQuestions.filter(q => 
        q.questionText.includes(unitName) || 
        q.explanation.includes(unitName)
      );
      if (unitFiltered.length > 0) {
        targetQuestions = unitFiltered;
      }
    }

    // 単元連動動的問題を最優先にプールを作成
    const fullPool = [...dynQuestions, ...targetQuestions].sort(() => Math.random() - 0.5);
    const freshPool = fullPool.filter(q => !recentQuestionIds.includes(q.id));
    const poolToUse = freshPool.length >= 5 ? freshPool : fullPool;

    const selected5 = poolToUse.slice(0, 5);
    setRecentQuestionIds(selected5.map(q => q.id));


    setActiveQuestions(selected5);
    setActiveSubject(subject);
    setQuizStartTime(Date.now());
    setCurrentScreen('quiz');
  };

  // 📝 単元確認テスト・定期テストモードの起動
  const [examUnit, setExamUnit] = useState<CurriculumUnit | undefined>(undefined);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);

  const handleStartUnitExam = (subject: Subject, grade: number, unit: CurriculumUnit) => {
    setExamUnit(unit);
    setActiveSubject(subject);

    // 10問の本格単元テスト問題を生成
    const examPool: Question[] = [];
    for (let i = 0; i < 10; i++) {
      examPool.push(generateDynamicQuestion(subject, grade, unit.unitName));
    }
    setExamQuestions(examPool);
    setCurrentScreen('exam');
  };


  const handleFinishQuiz = (correctCount: number, totalCount: number, wrongQuestionIds: string[]) => {
    const timeSpentSeconds = Math.floor((Date.now() - quizStartTime) / 1000);

    const goalTarget = activeProfile.dailyGoal?.targetQuestions || 5;
    const reportsBefore = storage.getReports(activeProfile.id);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReportBefore = reportsBefore.find(r => r.date === todayStr);
    const countBefore = todayReportBefore ? todayReportBefore.questionsAttempted : 0;

    // アクティブなプロファイルに対して学習レポートを登録
    storage.addReportData(activeSubject, correctCount === totalCount, timeSpentSeconds, activeProfile.id);

    // 選択された単元がある場合は進捗完了を記録
    if (activeUnit) {
      markUnitCompleted(activeProfile.id, activeUnit.code);
    }

    const countAfter = countBefore + totalCount;

    if (countBefore < goalTarget && countAfter >= goalTarget) {
      setShowGoalAchievedModal(true);
    }

    // 間違えた問題をアクティブなプロファイルのノートに登録
    wrongQuestionIds.forEach(id => {
      const q = questions.find(item => item.id === id);
      if (q) {
        storage.addReviewItem({
          questionId: q.id,
          subject: q.subject,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }, activeProfile.id);
      }
    });

    setQuizResults({
      correctCount,
      totalCount,
      wrongQuestionIds
    });
    setCurrentScreen('result');
  };

  const handleCloseResult = () => {
    setQuizResults(null);
    setCurrentScreen('home');
    setStats(storage.getStats(activeProfile.id));
  };

  return (
    <div className="app-layout">
      <Navbar
        stats={stats}
        activeProfile={activeProfile}
        onOpenShop={() => setCurrentScreen('shop')}
        onOpenCollection={() => setCurrentScreen('collection')}
        onOpenReview={() => setCurrentScreen('review')}
        onOpenDashboard={() => setCurrentScreen('dashboard')}
        onOpenRoadmap={() => setCurrentScreen('roadmap')}
        onOpenProfileSelector={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        currentScreen={currentScreen}

        onGoHome={() => setCurrentScreen('home')}
      />

      <main className="main-content">
        {currentScreen === 'home' && (
          <div className="home-screen fade-in">
            {/* ウェルカムバナー */}
            <section className="welcome-banner">
              <div className="banner-user-info">
                <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={activeProfile.avatarEmoji} size="md" className="banner-avatar-display" />
                <div className="banner-text">
                  <h2>こんにちは、{activeProfile.name}さん！ 🚀</h2>
                  <p>きょうもいっしょにクイズを解いてレベルアップしよう！</p>
                </div>
              </div>
              <button 
                className="banner-switch-btn"
                onClick={() => { setShowProfileModal(true); }}
              >
                👨‍👩‍👧‍👦 アカウント切り替え / アイコン・鍵設定
              </button>
            </section>
            {/* 🎯 本日のノルマ進捗カード */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const reports = storage.getReports(activeProfile.id);
              const todayReport = reports.find(r => r.date === todayStr);
              const todayAttempted = todayReport ? todayReport.questionsAttempted : 0;
              const goal = activeProfile.dailyGoal || { targetQuestions: 5, targetMinutes: 10, rewardText: '🎮 ゲーム30分OK！' };
              const goalTarget = goal.targetQuestions;
              const isGoalAchieved = todayAttempted >= goalTarget;

              return (
                <section className="daily-goal-card card">
                  <div className="goal-card-header">
                    <div className="goal-card-title">
                      <span className="goal-emoji">🎯</span>
                      <h3>きょうのノルマ ({todayAttempted} / {goalTarget} 問)</h3>
                    </div>
                    {isGoalAchieved ? (
                      <span 
                        className="goal-badge achieved" 
                        onClick={() => setShowGoalAchievedModal(true)}
                        title="ご褒美カードを見る"
                      >
                        🎉 達成済み！(ご褒美を見る)
                      </span>
                    ) : (
                      <span className="goal-badge in-progress">あと {Math.max(0, goalTarget - todayAttempted)} 問！</span>
                    )}
                  </div>

                  <div className="goal-progress-bar">
                    <div 
                      className="goal-progress-fill" 
                      style={{ width: `${Math.min(100, Math.floor((todayAttempted / goalTarget) * 100))}%` }}
                    ></div>
                  </div>

                  <div className="goal-card-footer">
                    <span className="goal-reward-preview">
                      🎁 クリアのご褒美（約束）: <strong>{goal.rewardText}</strong>
                    </span>
                  </div>
                </section>
              );
            })()}

            {/* 教科選択セクション */}
            <section className="subject-section">
              <div className="section-header-flex">
                <h2 className="section-title">🎒 教科をえらぶ</h2>
                <div className="grid-cols-toggle">
                  <span className="cols-label">表示列数：</span>
                  <button 
                    type="button" 
                    className={`cols-btn ${gridCols === 'auto' ? 'active' : ''}`}
                    onClick={() => setGridCols('auto')}
                  >
                    🖥️ 成り行き(自動)
                  </button>
                  <button 
                    type="button" 
                    className={`cols-btn ${gridCols === 'cols-2' ? 'active' : ''}`}
                    onClick={() => setGridCols('cols-2')}
                  >
                    📱 2列(ワイド)
                  </button>
                  <button 
                    type="button" 
                    className={`cols-btn ${gridCols === 'cols-3' ? 'active' : ''}`}
                    onClick={() => setGridCols('cols-3')}
                  >
                    💻 3列(標準)
                  </button>
                </div>
              </div>

              <div className={`subject-grid ${gridCols}`}>
                <SubjectCard
                  id="math"
                  title="算数・数学"
                  emoji="🧮"
                  colorClass="card-math"
                  description="計算や図形、分数のナゾを解き明かそう！"
                  defaultGrade={activeProfile.grade || 3}
                  onSelect={handleSelectSubject}
                />
                <SubjectCard
                  id="japanese"
                  title="国語"
                  emoji="📖"
                  colorClass="card-japanese"
                  description="漢字やことわざを覚えて、日本語マスターになろう！"
                  defaultGrade={activeProfile.grade || 3}
                  onSelect={handleSelectSubject}
                />
                <SubjectCard
                  id="science"
                  title="理科"
                  emoji="🧪"
                  colorClass="card-science"
                  description="宇宙の不思議や生き物のヒミツをさぐろう！"
                  defaultGrade={activeProfile.grade || 3}
                  onSelect={handleSelectSubject}
                />
                <SubjectCard
                  id="social"
                  title="社会"
                  emoji="🗺"
                  colorClass="card-social"
                  description="日本の都道府県や歴史のヒーローたちに会いにいこう！"
                  defaultGrade={activeProfile.grade || 3}
                  onSelect={handleSelectSubject}
                />
                <SubjectCard
                  id="english"
                  title="英語"
                  emoji="🔤"
                  colorClass="card-english"
                  description="たのしい単語や英語のあいさつにチャレンジ！"
                  defaultGrade={activeProfile.grade || 3}
                  onSelect={handleSelectSubject}
                />
              </div>
            </section>
          </div>
        )}

        {currentScreen === 'quiz' && (
          <QuizScreen
            questions={activeQuestions}
            onFinish={handleFinishQuiz}
            onCancel={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'collection' && (
          <CollectionScreen
            stats={stats}
            profileEmoji={activeProfile.avatarEmoji}
            onUpdateStats={(newStats) => {
              setStats(newStats);
              storage.saveStats(newStats, activeProfile.id);
            }}
            onClose={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'review' && (
          <ReviewScreen
            onClose={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'dashboard' && (
          <ParentDashboard
            onClose={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {/* ショップはモーダル表示 */}
      {currentScreen === 'shop' && (
        <ShopModal
          stats={stats}
          profileEmoji={activeProfile.avatarEmoji}
          onUpdateStats={(newStats) => {
            setStats(newStats);
            storage.saveStats(newStats, activeProfile.id);
          }}
          onClose={() => setCurrentScreen('home')}
        />
      )}

      {/* プロファイル選択モーダル */}
      {showProfileModal && (
        <ProfileSelectorModal
          onSelectProfile={handleSelectProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* 🎯 ノルマ達成お祝い＆ご褒美モーダル */}
      {showGoalAchievedModal && (
        <GoalAchievedModal
          profile={activeProfile}
          onClose={() => setShowGoalAchievedModal(false)}
        />
      )}

      {/* 🗺️ 学習ロードマップ画面 */}
      {currentScreen === 'roadmap' && (
        <RoadmapScreen
          profile={activeProfile}
          onSelectUnitQuiz={(subject, grade, unit) => handleSelectSubject(subject, grade, unit)}
          onStartUnitExam={(subject, grade, unit) => handleStartUnitExam(subject, grade, unit)}
          onClose={() => setCurrentScreen('home')}
        />
      )}

      {/* 📝 単元確認テスト・定期テスト画面 */}
      {currentScreen === 'exam' && examUnit && (
        <ExamScreen
          profile={activeProfile}
          subject={activeSubject}
          grade={activeProfile.grade || 3}
          unitName={examUnit.unitName}
          unitCode={examUnit.code}
          questions={examQuestions}
          onFinish={() => {
            setCurrentScreen('roadmap');
          }}
          onCancel={() => setCurrentScreen('roadmap')}
        />
      )}


      {/* リザルト画面 */}
      {currentScreen === 'result' && quizResults && (
        <ResultModal
          correctCount={quizResults.correctCount}
          totalCount={quizResults.totalCount}
          stats={stats}
          onUpdateStats={(newStats) => {
            setStats(newStats);
            storage.saveStats(newStats, activeProfile.id);
          }}
          onRetry={() => handleSelectSubject(activeSubject, activeProfile.grade || 3)}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
};
export default App;
