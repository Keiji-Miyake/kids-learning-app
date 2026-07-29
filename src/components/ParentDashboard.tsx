import React, { useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import type { DailyReport, Subject, UserProfile, DailyGoal } from '../types';
import { sound } from '../utils/sound';

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

  // 現在選択中プロファイルのノルマ設定
  const targetProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];
  const [goalType, setGoalType] = useState<'total_count' | 'subject_specific'>(
    targetProfile?.dailyGoal?.goalType || 'total_count'
  );
  const [targetQuestions, setTargetQuestions] = useState<number>(targetProfile?.dailyGoal?.targetQuestions || 5);
  const [targetMinutes, setTargetMinutes] = useState<number>(targetProfile?.dailyGoal?.targetMinutes || 10);
  const [rewardText, setRewardText] = useState<string>(targetProfile?.dailyGoal?.rewardText || '🎮 ゲーム30分OK！');
  const [targetSubject, setTargetSubject] = useState<Subject | 'all'>(targetProfile?.dailyGoal?.targetSubject || 'all');
  const [targetUnitName, setTargetUnitName] = useState<string>(targetProfile?.dailyGoal?.targetUnitName || 'all');
  const [subjectGoals, setSubjectGoals] = useState<Partial<Record<Subject, { targetQuestions: number; targetMinutes: number }>>>(
    targetProfile?.dailyGoal?.subjectGoals || {
      math: { targetQuestions: 3, targetMinutes: 5 },
      japanese: { targetQuestions: 3, targetMinutes: 5 },
      science: { targetQuestions: 0, targetMinutes: 0 },
      social: { targetQuestions: 0, targetMinutes: 0 },
      english: { targetQuestions: 0, targetMinutes: 0 }
    }
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');

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



  useEffect(() => {
    if (targetProfile) {
      setGoalType(targetProfile.dailyGoal?.goalType || 'total_count');
      setTargetQuestions(targetProfile.dailyGoal?.targetQuestions || 5);
      setTargetMinutes(targetProfile.dailyGoal?.targetMinutes || 10);
      setRewardText(targetProfile.dailyGoal?.rewardText || '🎮 ゲーム30分OK！');
      setTargetSubject(targetProfile.dailyGoal?.targetSubject || 'all');
      setTargetUnitName(targetProfile.dailyGoal?.targetUnitName || 'all');
      if (targetProfile.dailyGoal?.subjectGoals) {
        setSubjectGoals(targetProfile.dailyGoal.subjectGoals);
      } else {
        setSubjectGoals({
          math: { targetQuestions: 3, targetMinutes: 5 },
          japanese: { targetQuestions: 3, targetMinutes: 5 },
          science: { targetQuestions: 0, targetMinutes: 0 },
          social: { targetQuestions: 0, targetMinutes: 0 },
          english: { targetQuestions: 0, targetMinutes: 0 }
        });
      }
    }
  }, [selectedProfileId, targetProfile]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile) return;

    sound.playClick();
    const updatedGoal: DailyGoal = {
      targetQuestions,
      targetMinutes,
      rewardText: rewardText.trim() || '🎉 ノルマ達成おめでとう！',
      goalType,
      targetSubject,
      targetUnitName,
      subjectGoals
    };

    const updatedProfile: UserProfile = {
      ...targetProfile,
      dailyGoal: updatedGoal
    };

    storage.updateProfile(updatedProfile);
    const updatedList = storage.getProfiles();
    setProfiles(updatedList);

    setSaveSuccessMessage(`${targetProfile.name} さんのノルマ＆ご褒美の設定を保存しました！`);
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  const reports: DailyReport[] = storage.getReports(selectedProfileId);

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
        {/* 🎯 1日のノルマ＆ご褒美設定フォーム */}
        <form className="goal-setting-card card" onSubmit={handleSaveGoal}>
          <h3 className="chart-title">🎯 1日のノルマ＆ご褒美の設定（{targetProfile.name} さん）</h3>
          <p className="goal-desc">達成したらゲーム時間やお小遣いなどをあげられるよう、目標と約束を設定できます。</p>

          <div className="goal-form-grid">
            <div className="form-group">
              <label>1日の目標回答数：</label>
              <select
                className="profile-input"
                value={targetQuestions}
                onChange={(e) => setTargetQuestions(Number(e.target.value))}
              >
                <option value={3}>3問（手軽に挑戦）</option>
                <option value={5}>5問（おすすめ・標準）</option>
                <option value={10}>10問（しっかり学習）</option>
                <option value={15}>15問（たっぷり挑戦）</option>
                <option value={20}>20問（がっつり達成）</option>
              </select>
            </div>

            <div className="form-group">
              <label>1日の目標学習時間：</label>
              <select
                className="profile-input"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Number(e.target.value))}
              >
                <option value={5}>5分</option>
                <option value={10}>10分（標準）</option>
                <option value={15}>15分</option>
                <option value={30}>30分（長時間学習）</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>達成した時の約束・ご褒美（自由入力）：</label>
              <input
                type="text"
                className="profile-input"
                placeholder="例: 🎮 ゲーム30分遊んでOK！ / 💰 お小遣い50円！ / 🍦 アイスプレゼント！"
                value={rewardText}
                onChange={(e) => setRewardText(e.target.value)}
                maxLength={30}
                required
              />
            </div>
          </div>

          {/* 🌟 ノルマ達成判定基準の選択 */}
          <div style={{ background: '#eef2ff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1.5px solid #6366f1' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#3730a3', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span> ノルマ達成の判定基準（モード選択）
            </h4>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: goalType === 'total_count' ? '#ffffff' : 'transparent', padding: '10px 14px', borderRadius: '8px', border: goalType === 'total_count' ? '2px solid #6366f1' : '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <input
                  type="radio"
                  name="goalType"
                  value="total_count"
                  checked={goalType === 'total_count'}
                  onChange={() => setGoalType('total_count')}
                />
                <span>🔘 1日の合計問題数で判定（シンプル）</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: goalType === 'subject_specific' ? '#ffffff' : 'transparent', padding: '10px 14px', borderRadius: '8px', border: goalType === 'subject_specific' ? '2px solid #6366f1' : '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <input
                  type="radio"
                  name="goalType"
                  value="subject_specific"
                  checked={goalType === 'subject_specific'}
                  onChange={() => setGoalType('subject_specific')}
                />
                <span>📚 各教科ごとの目標数で判定（教科別）</span>
              </label>
            </div>
            <p style={{ fontSize: '12px', color: '#4338ca', marginTop: '8px', margin: '8px 0 0 0' }}>
              {goalType === 'total_count'
                ? '※ 何の教科でも合計で設定問題数（例: 5問）を解けばノルマ達成となります。'
                : '※ 各教科ごとの目標数（例: 算数3問・国語3問）を全てクリアした時にノルマ達成となります。'}
            </p>
          </div>

          {/* ② 重点対象教科・単元の設定 */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>2️⃣</span> 重点的に学習させたい教科 ＆ 単元（オプション）
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>重点教科：</label>
                <select
                  className="profile-input"
                  value={targetSubject}
                  onChange={(e) => setTargetSubject(e.target.value as Subject | 'all')}
                >
                  <option value="all">指定なし（全体バランス）</option>
                  <option value="math">算数・数学</option>
                  <option value="japanese">国語</option>
                  <option value="science">理科</option>
                  <option value="social">社会</option>
                  <option value="english">英語</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 'bold' }}>重点単元名：</label>
                <input
                  type="text"
                  className="profile-input"
                  placeholder="例: 一次関数 / 漢字"
                  value={targetUnitName === 'all' ? '' : targetUnitName}
                  onChange={(e) => setTargetUnitName(e.target.value.trim() || 'all')}
                />
              </div>
            </div>
          </div>

          {/* ③ 教科ごとの目標問題数設定 */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>3️⃣</span> 教科ごとの目標問題数（教科別判定モード用）
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {(['math', 'japanese', 'science', 'social', 'english'] as Subject[]).map(sub => {
                const labels: Record<Subject, string> = {
                  math: '🧮 算数',
                  japanese: '📖 国語',
                  science: '🧪 理科',
                  social: '🗺️ 社会',
                  english: '🔤 英語'
                };
                const val = subjectGoals[sub]?.targetQuestions || 0;

                return (
                  <div key={sub} className="form-group">
                    <label style={{ fontSize: '13px', fontWeight: 'bold' }}>{labels[sub]}:</label>
                    <input
                      type="number"
                      className="profile-input"
                      style={{ padding: '6px 10px' }}
                      min={0}
                      max={20}
                      value={val === 0 ? '' : val}
                      placeholder="0問"
                      onChange={(e) => {
                        const num = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setSubjectGoals(prev => ({
                          ...prev,
                          [sub]: { targetQuestions: num, targetMinutes: num * 2 }
                        }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="goal-actions" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="submit" className="start-btn">ノルマ・ご褒美を保存する 💾</button>
            {saveSuccessMessage && <span className="save-success-msg" style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ {saveSuccessMessage}</span>}
          </div>
        </form>

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

        {/* グラフカード */}
        <div className="dashboard-chart-card card">
          <h3 className="chart-title">🎨 教科ごとの学習時間バランス</h3>
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} style={{ width: '100%', height: '280px' }} />
          </div>
        </div>

        {/* 履歴テーブル */}
        <div className="dashboard-history-card card">
          <h3 className="chart-title">📅 日々の記録</h3>
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
                  </tr>
                </thead>
                <tbody>
                  {[...reports].reverse().slice(0, 7).map((r, i) => {
                    const dailyAcc = r.questionsAttempted > 0 ? Math.round((r.questionsCorrect / r.questionsAttempted) * 100) : 0;
                    return (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td>{r.questionsAttempted}問</td>
                        <td>{r.questionsCorrect}問</td>
                        <td style={{ color: getAccuracyColor(dailyAcc), fontWeight: 'bold' }}>{dailyAcc}%</td>
                      </tr>
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
