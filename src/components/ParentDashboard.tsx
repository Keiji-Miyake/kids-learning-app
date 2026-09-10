import React, { useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import type { DailyReport, Subject, UserProfile, DailyGoal, WeeklySchedule, DayOfWeek } from '../types';
import { sound } from '../utils/sound';
import { getGoalProgress, getEffectiveDailyGoal, DAY_OF_WEEK_LABELS } from '../utils/goalEvaluator';
import { getSRSStats } from '../utils/spacedRepetition';
import { GoalSettingWizard } from './GoalSettingWizard';


interface ParentDashboardProps {
  onClose: () => void;
}

export const verifyParentChallenge = (num1: number, num2: number, answer: number): boolean => {
  if (isNaN(answer)) return false;
  return num1 * num2 === answer;
};

export const verifyParentPin = (profilePin?: string, inputPin?: string): boolean => {
  if (!profilePin) return true;
  return profilePin === inputPin;
};


export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // プロファイル一覧
  const [profiles, setProfiles] = useState<UserProfile[]>(storage.getProfiles());
  const [selectedProfileId, setSelectedProfileId] = useState<string>(storage.getActiveProfileId());
  
  // 保護者認証ステート (親ユーザーのみ知るマスターパスワード)
  const [isParentUnlocked, setIsParentUnlocked] = useState<boolean>(false);
  const [parentInputPassword, setParentInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // パスワード変更用ステート
  const [newParentPassword, setNewParentPassword] = useState<string>('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<string>('');

  // 📅 学習履歴詳細アコーディオン開閉・フィルター
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [onlyWrongFilter, setOnlyWrongFilter] = useState<boolean>(false);

  // 現在選択中プロファイル
  const targetProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  const handleParentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    
    const isValid = await storage.verifyParentPasswordAsync(parentInputPassword);
    if (isValid) {
      sound.playCorrect();
      setIsParentUnlocked(true);
      setAuthError('');
    } else {
      sound.playWrong();
      setAuthError('❌ 保護者パスワードが正しくありません。');
    }
  };

  const handleChangeParentPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentPassword.trim()) return;
    sound.playClick();
    storage.setParentPassword(newParentPassword);
    setPasswordChangeMsg('✅ 保護者パスワードを更新しました！');
    setNewParentPassword('');
    setTimeout(() => setPasswordChangeMsg(''), 3000);
  };

  const handleSaveGoal = (updatedGoal: DailyGoal, updatedSchedule?: WeeklySchedule) => {
    if (!targetProfile) return;

    const updatedProfile: UserProfile = {
      ...targetProfile,
      dailyGoal: updatedGoal,
      weeklySchedule: updatedSchedule !== undefined ? updatedSchedule : targetProfile.weeklySchedule
    };

    storage.updateProfile(updatedProfile);
    const updatedList = storage.getProfiles();
    setProfiles(updatedList);
  };

  const reports: DailyReport[] = storage.getReports(selectedProfileId);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = reports.find(r => r.date === todayStr);
  const dayMap: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDayKey = dayMap[new Date().getDay()];
  const effectiveGoal = targetProfile ? getEffectiveDailyGoal(targetProfile) : undefined;
  const goalProgress = getGoalProgress(effectiveGoal, todayReport);
  const isWeeklyActive = targetProfile?.weeklySchedule?.enabled;


  // 統計データの計算
  const totalQuestions = reports.reduce((acc, r) => acc + r.questionsAttempted, 0);
  const totalCorrect = reports.reduce((acc, r) => acc + r.questionsCorrect, 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const subjectMinutesTotal: Record<Subject, number> = {
    math: 0,
    japanese: 0,
    science: 0,
    social: 0,
    english: 0
  };

  reports.forEach(r => {
    (Object.keys(subjectMinutesTotal) as Subject[]).forEach(sub => {
      subjectMinutesTotal[sub] += r.subjectMinutes[sub] || 0;
    });
  });

  const totalMinutes = Object.values(subjectMinutesTotal).reduce((acc, m) => acc + m, 0);

  // Canvas によるグラフ描画 (円グラフ: 各教科の学習時間配分)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const subjects: { key: Subject; label: string; color: string }[] = [
      { key: 'math', label: '算数', color: '#ff5e62' },
      { key: 'japanese', label: '国語', color: '#ffb938' },
      { key: 'science', label: '理科', color: '#3cd184' },
      { key: 'social', label: '社会', color: '#3ca7d1' },
      { key: 'english', label: '英語', color: '#a25ff0' }
    ];

    if (totalMinutes === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '15px "Outfit", "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('まだ学習データがありません。', width / 2, height / 2 - 10);
      ctx.fillText('クイズを解いて学習をはじめましょう！', width / 2, height / 2 + 15);
      return;
    }

    const centerX = width * 0.35;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.32;
    let startAngle = -Math.PI / 2;

    subjects.forEach((sub) => {
      const minutes = subjectMinutesTotal[sub.key];
      if (minutes === 0) return;

      const sliceAngle = (minutes / totalMinutes) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = sub.color;
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const legendX = width * 0.7;
    const legendStartY = height * 0.2;
    const itemHeight = 28;

    subjects.forEach((sub, i) => {
      const minutes = subjectMinutesTotal[sub.key];
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      const y = legendStartY + i * itemHeight;

      ctx.fillStyle = sub.color;
      ctx.beginPath();
      ctx.roundRect(legendX, y, 14, 14, 4);
      ctx.fill();

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 13px "Outfit", "Noto Sans JP", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${sub.label}: ${Math.round(minutes * 10) / 10}分 (${percentage}%)`, legendX + 22, y + 7);
    });
  }, [reports, totalMinutes, selectedProfileId]);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return '#3cd184';
    if (acc >= 50) return '#ffb938';
    return '#ff5e62';
  };

  const formatDuration = (minutes: number, seconds?: number): string => {
    const totalSec = seconds !== undefined ? seconds : Math.round(minutes * 60);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m === 0) return `${s}秒`;
    if (s === 0) return `${m}分`;
    return `${m}分${s}秒`;
  };

  const getSubjectBadge = (sub: Subject) => {
    switch (sub) {
      case 'math': return { label: '算数・数学', emoji: '🧮', color: '#ff5e62', bg: '#fee2e2' };
      case 'japanese': return { label: '国語', emoji: '📖', color: '#d97706', bg: '#fef3c7' };
      case 'science': return { label: '理科', emoji: '🧪', color: '#16a34a', bg: '#dcfce7' };
      case 'social': return { label: '社会', emoji: '🗺', color: '#0284c7', bg: '#e0f2fe' };
      case 'english': return { label: '英語', emoji: '🔤', color: '#7c3aed', bg: '#f3e8ff' };
    }
  };

  if (!isParentUnlocked) {
    return (
      <div className="dashboard-container fade-in">
        <div className="dashboard-header">
          <h2 className="dashboard-title">🔒 保護者専用ログイン・管理エリア</h2>
          <p className="dashboard-subtitle">学習レポートの閲覧および1日の目標ノルマ・ご褒美の設定変更は保護者専用です。</p>
        </div>

        <form className="card parent-auth-card" onSubmit={handleParentAuthSubmit} style={{ maxWidth: '440px', margin: '40px auto', padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>👨‍👩‍👧 保護者パスワードを入力</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            保護者の方だけが知るパスワードを入力してください。<br />
            <small style={{ color: '#94a3b8' }}>(※ 初期パスワード: parent)</small>
          </p>

          <div className="form-group">
            <label>保護者パスワード：</label>
            <input
              type="password"
              className="profile-input"
              placeholder="保護者パスワード"
              value={parentInputPassword}
              onChange={(e) => setParentInputPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          {authError && <p style={{ color: '#ef4444', fontWeight: 'bold', marginTop: '12px', fontSize: '14px' }}>{authError}</p>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="start-btn" style={{ flex: 1 }}>ログインして進む 🔓</button>
            <button type="button" className="cancel-btn" onClick={onClose}>もどる 🏠</button>
          </div>
        </form>
      </div>
    );
  }


  return (
    <div className="dashboard-container fade-in">

      <div className="dashboard-header">
        <h2 className="dashboard-title">📊 保護者向け学習レポート ＆ ノルマ管理</h2>
        <p className="dashboard-subtitle">お子様ごとの進捗確認と、1日の目標ノルマ・ご褒美を設定できます。</p>
      </div>

      {/* 対象のお子様（プロファイル）の切り替えタブ */}
      <div className="dashboard-profile-tabs">
        {profiles.map(p => (
          <button
            key={p.id}
            className={`dashboard-tab-btn ${p.id === selectedProfileId ? 'active' : ''}`}
            onClick={() => { sound.playClick(); setSelectedProfileId(p.id); }}
          >
            <span className="tab-emoji">{p.avatarEmoji}</span>
            <span className="tab-name">{p.name} さんのデータ</span>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* 🎯 1日のノルマ＆ご褒美設定ウィザード */}
        <GoalSettingWizard profile={targetProfile} onSave={handleSaveGoal} />

        {/* 🌟 本日の目標進捗可視化カード */}
        <div className="card" style={{ padding: '20px', borderRadius: '16px', background: '#f0fdf4', border: '2px solid #86efac', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>📈</span>
              <strong style={{ fontSize: '16px', color: '#166534' }}>
                本日の目標進捗（{goalProgress.currentLabel}）
              </strong>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                {goalProgress.goalType === 'subject_specific' && '📚 科目別目標'}
                {goalProgress.goalType === 'total_count' && '🎯 合計問題数重視'}
                {goalProgress.goalType === 'total_time' && '⏱️ 合計時間重視'}
              </span>
              {isWeeklyActive && (
                <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                  📅 {DAY_OF_WEEK_LABELS[currentDayKey]}の目標
                </span>
              )}
            </div>

            {goalProgress.isAchieved ? (
              <span style={{ background: '#16a34a', color: '#ffffff', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                🎉 本日のノルマ達成済み！
              </span>
            ) : (
              <span style={{ background: '#f59e0b', color: '#ffffff', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                ⏳ 挑戦中（進捗: {goalProgress.percent}%）
              </span>
            )}
          </div>

          <div className="goal-progress-bar" style={{ height: '10px', background: '#dcfce7', borderRadius: '5px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              className="goal-progress-fill"
              style={{ width: `${goalProgress.percent}%`, height: '100%', background: goalProgress.isAchieved ? '#16a34a' : '#3b82f6', transition: 'width 0.4s ease' }}
            />
          </div>

          {goalProgress.subjects.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', marginBottom: '8px' }}>
                📚 科目ごとの進捗状況:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {goalProgress.subjects.map(sub => (
                  <div
                    key={sub.subject}
                    style={{
                      background: sub.isCompleted ? '#dcfce7' : '#ffffff',
                      border: sub.isCompleted ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px'
                    }}
                  >
                    <span style={{ fontWeight: 'bold', color: sub.isCompleted ? '#166534' : '#334155' }}>
                      {sub.label}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: sub.isCompleted ? '#16a34a' : '#64748b' }}>
                      {sub.isCompleted ? '✅ 達成!' : '⏳ 進行中'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* サマリーカード */}
        <div className="summary-cards-row">
          <div className="summary-card">
            <span className="card-icon">⏱️</span>
            <div className="card-info">
              <span className="card-value">{Math.round(totalMinutes * 10) / 10} 分</span>
              <span className="card-label">総学習時間</span>
            </div>
          </div>

          <div className="summary-card">
            <span className="card-icon">❓</span>
            <div className="card-info">
              <span className="card-value">{totalQuestions} 問</span>
              <span className="card-label">回答した問題数</span>
            </div>
          </div>

          <div className="summary-card">
            <span className="card-icon" style={{ color: getAccuracyColor(averageAccuracy) }}>🎯</span>
            <div className="card-info">
              <span className="card-value" style={{ color: getAccuracyColor(averageAccuracy) }}>{averageAccuracy}%</span>
              <span className="card-label">平均正答率</span>
            </div>
          </div>
        </div>

        {/* 🧠 忘却曲線・記憶定着ステータスカード */}
        {(() => {
          const srsData = storage.getSRSData(selectedProfileId);
          const srsStats = getSRSStats(srsData);

          return (
            <div className="card" style={{ marginTop: '16px', padding: '20px', border: '2px solid #8b5cf6', background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>🧠</span>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#581c87', fontWeight: '800' }}>
                    記憶定着・忘却曲線システム進捗
                  </h3>
                </div>
                <span style={{ fontSize: '11px', background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                  毎日同じ問題は出ない設計
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                1回解いた問題は<strong>1週間後</strong>、次は<strong>4週間後</strong>、さらに<strong>1ヶ月後</strong>に復習し、定着したらノルマから卒業（マスター）します。
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#15803d' }}>{srsStats.masteredCount}問</div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', marginTop: '2px' }}>👑 完全マスター（卒業）</div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed' }}>{srsStats.inProgressCount}問</div>
                  <div style={{ fontSize: '11px', color: '#6b21a8', fontWeight: 'bold', marginTop: '2px' }}>🌱 記憶定着中</div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: srsStats.dueTodayCount > 0 ? '#dc2626' : '#64748b' }}>
                    {srsStats.dueTodayCount}問
                  </div>
                  <div style={{ fontSize: '11px', color: srsStats.dueTodayCount > 0 ? '#b91c1c' : '#475569', fontWeight: 'bold', marginTop: '2px' }}>
                    🔔 今日の復習期日
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#d97706' }}>{srsStats.coolingDownCount}問</div>
                  <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold', marginTop: '2px' }}>⏳ クールダウン中</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f3e8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#4b5563', flexWrap: 'wrap', gap: '6px' }}>
                <span>ステップ内訳:</span>
                <span>🌱1回目(1週後): <strong>{srsStats.stageBreakdown[1] || 0}問</strong></span>
                <span>🌿2回目(4週後): <strong>{srsStats.stageBreakdown[2] || 0}問</strong></span>
                <span>🌳3回目(1月後): <strong>{srsStats.stageBreakdown[3] || 0}問</strong></span>
              </div>
            </div>
          );
        })()}

        {/* グラフカード */}
        <div className="dashboard-chart-card card">
          <h3 className="chart-title">🎨 教科ごとの学習時間バランス</h3>
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} style={{ width: '100%', height: '280px' }} />
          </div>
        </div>

        {/* 履歴テーブル ＆ 学習履歴詳細アコーディオン */}
        <div className="dashboard-history-card card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h3 className="chart-title" style={{ margin: 0 }}>📅 日々の記録 ＆ 学習履歴詳細</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>日付を押すと学習詳細が展開します</span>
          </div>
          {reports.length === 0 ? (
            <p className="no-data-text">まだ学習データがありません。</p>
          ) : (
            <div className="table-responsive">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>解いた問題数</th>
                    <th>正解数</th>
                    <th>その日の正答率</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[...reports].reverse().slice(0, 14).map((r, i) => {
                    const dailyAcc = r.questionsAttempted > 0 ? Math.round((r.questionsCorrect / r.questionsAttempted) * 100) : 0;
                    const isExpanded = expandedDate === r.date;
                    const dayTotalMinutes = Object.values(r.subjectMinutes || {}).reduce((acc, m) => acc + m, 0);

                    return (
                      <React.Fragment key={r.date || i}>
                        <tr
                          className={`history-summary-row ${isExpanded ? 'active-expanded' : ''}`}
                          onClick={() => { sound.playClick(); setExpandedDate(isExpanded ? null : r.date); }}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontWeight: 'bold' }}>{r.date}</td>
                          <td>{r.questionsAttempted}問</td>
                          <td>{r.questionsCorrect}問</td>
                          <td style={{ color: getAccuracyColor(dailyAcc), fontWeight: 'bold' }}>{dailyAcc}%</td>
                          <td>
                            <button
                              type="button"
                              className="detail-toggle-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playClick();
                                setExpandedDate(isExpanded ? null : r.date);
                              }}
                            >
                              {isExpanded ? '▲ 詳細を閉じる' : '▼ 詳細を見る'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="history-expanded-row">
                            <td colSpan={5} style={{ padding: '0', background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                              <div className="history-detail-panel fade-in" style={{ padding: '16px 20px', textAlign: 'left' }}>
                                {/* 日別サマリーヘッダー */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                                      ⏱️ その日の学習時間: <strong style={{ color: '#2563eb', fontSize: '15px' }}>{formatDuration(dayTotalMinutes)}</strong>
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      {(Object.entries(r.subjectMinutes || {}) as [Subject, number][])
                                        .filter(([_, min]) => min > 0)
                                        .map(([sub, min]) => {
                                          const badge = getSubjectBadge(sub);
                                          return (
                                            <span
                                              key={sub}
                                              style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                color: badge.color,
                                                background: badge.bg,
                                                padding: '2px 8px',
                                                borderRadius: '8px',
                                                border: `1px solid ${badge.color}33`
                                              }}
                                            >
                                              {badge.emoji} {badge.label}: {formatDuration(min)}
                                            </span>
                                          );
                                        })}
                                    </div>
                                  </div>

                                  {/* 不正解フィルター */}
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#b91c1c', cursor: 'pointer', background: '#fee2e2', padding: '4px 10px', borderRadius: '8px' }}>
                                    <input
                                      type="checkbox"
                                      checked={onlyWrongFilter}
                                      onChange={(e) => setOnlyWrongFilter(e.target.checked)}
                                      style={{ accentColor: '#dc2626', cursor: 'pointer' }}
                                    />
                                    <span>❌ 間違えた問題だけ表示</span>
                                  </label>
                                </div>

                                {/* セッション一覧 */}
                                {(!r.sessions || r.sessions.length === 0) ? (
                                  <p style={{ color: '#64748b', fontSize: '13px', margin: '8px 0' }}>
                                    ※ この日のセッション別詳細記録はありません（総問題数・正解数のみ記録されています）。
                                  </p>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {r.sessions.map((sess, sIdx) => {
                                      const subBadge = getSubjectBadge(sess.subject);
                                      const records = sess.questionRecords || [];
                                      const filteredRecords = onlyWrongFilter
                                        ? records.filter(q => !q.isCorrect)
                                        : records;

                                      if (onlyWrongFilter && filteredRecords.length === 0 && records.length > 0) {
                                        return null;
                                      }

                                      const timeStr = sess.timestamp ? new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                                      return (
                                        <div
                                          key={sess.id || sIdx}
                                          className="session-card"
                                          style={{
                                            background: '#ffffff',
                                            border: '1.5px solid #e2e8f0',
                                            borderRadius: '12px',
                                            padding: '14px 16px',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>
                                                🕒 {timeStr || `回 #${sIdx + 1}`}
                                              </span>
                                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', background: sess.sessionType === 'exam' ? '#8b5cf6' : '#3b82f6', padding: '2px 8px', borderRadius: '12px' }}>
                                                {sess.sessionType === 'exam' ? '📝 単元確認テスト' : '🎯 クイズ'}
                                              </span>
                                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: subBadge.color }}>
                                                {subBadge.emoji} {subBadge.label}
                                              </span>
                                              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                                                単元: <strong>{sess.unitName || '全般（ランダム）'}</strong>
                                              </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                                              <span style={{ color: '#475569' }}>
                                                ⏱️ {formatDuration(sess.durationMinutes, sess.durationSeconds)}
                                              </span>
                                              <span style={{ fontWeight: 'bold', color: sess.questionsCorrect === sess.questionsAttempted ? '#16a34a' : '#2563eb' }}>
                                                {sess.questionsCorrect} / {sess.questionsAttempted} 問正解
                                              </span>
                                            </div>
                                          </div>

                                          {/* 問題リスト */}
                                          {records.length === 0 ? (
                                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                              ※ このセッションの問題別詳細データはありません。
                                            </p>
                                          ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {filteredRecords.map((qRec, qIdx) => (
                                                <div
                                                  key={qRec.questionId || qIdx}
                                                  style={{
                                                    background: qRec.isCorrect ? '#f0fdf4' : '#fef2f2',
                                                    border: `1.5px solid ${qRec.isCorrect ? '#86efac' : '#fca5a5'}`,
                                                    borderRadius: '8px',
                                                    padding: '10px 12px',
                                                    fontSize: '13px'
                                                  }}
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                    <span style={{ fontSize: '16px', lineHeight: 1 }}>
                                                      {qRec.isCorrect ? '⭕' : '❌'}
                                                    </span>
                                                    <div style={{ flex: 1 }}>
                                                      <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                                                        問{qIdx + 1}: {qRec.questionText}
                                                      </div>
                                                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', marginTop: '4px' }}>
                                                        <span>
                                                          お子様の回答: <strong style={{ color: qRec.isCorrect ? '#16a34a' : '#dc2626' }}>{qRec.selectedAnswer}</strong>
                                                        </span>
                                                        {!qRec.isCorrect && (
                                                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                                                            ➔ 正解: {qRec.correctAnswer}
                                                          </span>
                                                        )}
                                                      </div>
                                                      {qRec.explanation && (
                                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                          💡 解説: {qRec.explanation}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 🔑 保護者パスワード変更カード */}

        <form className="card password-change-card" onSubmit={handleChangeParentPassword} style={{ marginTop: '20px', padding: '24px' }}>
          <h3 className="chart-title" style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>🔑 保護者用マスターパスワードの変更</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            お子様に推測されにくい、保護者の方だけがわかる新しいパスワードを設定できます。
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="password"
              className="profile-input"
              style={{ maxWidth: '240px' }}
              placeholder="新しい保護者パスワード"
              value={newParentPassword}
              onChange={(e) => setNewParentPassword(e.target.value)}
              required
            />
            <button type="submit" className="start-btn" style={{ padding: '8px 16px', fontSize: '13px' }}>
              パスワードを変更する 💾
            </button>
            {passwordChangeMsg && <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}>{passwordChangeMsg}</span>}
          </div>
        </form>
      </div>


      <div className="dashboard-footer">
        <button className="back-home-btn" onClick={() => { sound.playClick(); onClose(); }}>
          メニューにもどる 🏠
        </button>
      </div>
    </div>
  );
};
export default ParentDashboard;
