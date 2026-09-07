import React, { useState, useEffect } from 'react';
import type { DailyGoal, GoalType, Subject, SubjectGoal, UserProfile } from '../types';
import { sound } from '../utils/sound';

interface GoalSettingWizardProps {
  profile: UserProfile;
  onSave: (goal: DailyGoal) => void;
}

const SUBJECT_LIST: { key: Subject; label: string; icon: string }[] = [
  { key: 'math', label: '算数', icon: '🧮' },
  { key: 'japanese', label: '国語', icon: '📖' },
  { key: 'science', label: '理科', icon: '🧪' },
  { key: 'social', label: '社会', icon: '🗺️' },
  { key: 'english', label: '英語', icon: '🔤' }
];

const REWARD_SUGGESTIONS = [
  '🎮 ゲーム30分OK！',
  '🍦 アイスプレゼント！',
  '💰 お小遣い50円GET！',
  '📚 好きなマンガ1冊！',
  '🎉 自由時間1時間！'
];

export const GoalSettingWizard: React.FC<GoalSettingWizardProps> = ({ profile, onSave }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [goalType, setGoalType] = useState<GoalType>(profile.dailyGoal?.goalType || 'subject_specific');
  const [targetQuestions, setTargetQuestions] = useState<number>(profile.dailyGoal?.targetQuestions || 5);
  const [targetMinutes, setTargetMinutes] = useState<number>(profile.dailyGoal?.targetMinutes || 10);
  const [rewardText, setRewardText] = useState<string>(profile.dailyGoal?.rewardText || '🎮 ゲーム30分OK！');
  const [targetSubject, setTargetSubject] = useState<Subject | 'all'>(profile.dailyGoal?.targetSubject || 'all');
  const [targetUnitName, setTargetUnitName] = useState<string>(profile.dailyGoal?.targetUnitName || 'all');

  const [subjectGoals, setSubjectGoals] = useState<Record<Subject, SubjectGoal>>(() => {
    const initial: Record<Subject, SubjectGoal> = {
      math: { targetQuestions: 3, targetMinutes: 5 },
      japanese: { targetQuestions: 3, targetMinutes: 5 },
      science: { targetQuestions: 0, targetMinutes: 0 },
      social: { targetQuestions: 0, targetMinutes: 0 },
      english: { targetQuestions: 0, targetMinutes: 0 }
    };
    if (profile.dailyGoal?.subjectGoals) {
      SUBJECT_LIST.forEach(({ key }) => {
        const sg = profile.dailyGoal?.subjectGoals?.[key];
        if (typeof sg === 'number') {
          initial[key] = { targetQuestions: sg, targetMinutes: 0 };
        } else if (sg) {
          initial[key] = {
            targetQuestions: sg.targetQuestions || 0,
            targetMinutes: sg.targetMinutes || 0
          };
        }
      });
    }
    return initial;
  });

  const [savedToast, setSavedToast] = useState<string>('');

  // プロファイル切り替え時にステート同期
  useEffect(() => {
    setCurrentStep(1);
    setGoalType(profile.dailyGoal?.goalType || 'subject_specific');
    setTargetQuestions(profile.dailyGoal?.targetQuestions || 5);
    setTargetMinutes(profile.dailyGoal?.targetMinutes || 10);
    setRewardText(profile.dailyGoal?.rewardText || '🎮 ゲーム30分OK！');
    setTargetSubject(profile.dailyGoal?.targetSubject || 'all');
    setTargetUnitName(profile.dailyGoal?.targetUnitName || 'all');

    const nextGoals: Record<Subject, SubjectGoal> = {
      math: { targetQuestions: 3, targetMinutes: 5 },
      japanese: { targetQuestions: 3, targetMinutes: 5 },
      science: { targetQuestions: 0, targetMinutes: 0 },
      social: { targetQuestions: 0, targetMinutes: 0 },
      english: { targetQuestions: 0, targetMinutes: 0 }
    };
    if (profile.dailyGoal?.subjectGoals) {
      SUBJECT_LIST.forEach(({ key }) => {
        const sg = profile.dailyGoal?.subjectGoals?.[key];
        if (typeof sg === 'number') {
          nextGoals[key] = { targetQuestions: sg, targetMinutes: 0 };
        } else if (sg) {
          nextGoals[key] = {
            targetQuestions: sg.targetQuestions || 0,
            targetMinutes: sg.targetMinutes || 0
          };
        }
      });
    }
    setSubjectGoals(nextGoals);
  }, [profile]);

  const handleNext = () => {
    sound.playClick();
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    sound.playClick();
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const newGoal: DailyGoal = {
      goalType,
      targetQuestions,
      targetMinutes,
      rewardText: rewardText.trim() || '🎉 ノルマ達成おめでとう！',
      targetSubject,
      targetUnitName,
      subjectGoals
    };

    onSave(newGoal);
    setSavedToast(`${profile.name} さんのノルマ・ご褒美を保存しました！`);
    setTimeout(() => setSavedToast(''), 3000);
  };

  return (
    <div className="goal-wizard-container card" style={{ padding: '24px', marginBottom: '24px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* ステップインジケーター */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>🎯</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
              1日の目標設定ウィザード（{profile.name} さん）
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              目的に合わせてステップに沿ってかんたんに目標を設定できます。
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { step: 1, label: 'タイプ' },
            { step: 2, label: '目標値' },
            { step: 3, label: 'ご褒美' }
          ].map(({ step, label }) => (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: currentStep === step ? '#3b82f6' : (currentStep > step ? '#dcfce7' : '#f1f5f9'),
                color: currentStep === step ? '#ffffff' : (currentStep > step ? '#15803d' : '#64748b')
              }}
            >
              <span>{currentStep > step ? '✓' : step}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ================= ステップ 1: 目標タイプの選択 ================= */}
        {currentStep === 1 && (
          <div className="wizard-step fade-in">
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              1. 目標タイプの選択
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              何をもって今日のノルマ達成とするかを選択してください。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {/* 科目別目標 (デフォルト) */}
              <div
                onClick={() => { sound.playClick(); setGoalType('subject_specific'); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: goalType === 'subject_specific' ? '2.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                  background: goalType === 'subject_specific' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: goalType === 'subject_specific' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>📚</span>
                  <strong style={{ fontSize: '15px', color: goalType === 'subject_specific' ? '#1d4ed8' : '#1e293b' }}>
                    科目別目標（おすすめ・標準）
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  算数は5問・10分、国語は3問など、科目ごとに問題数と学習時間を個別に設定します。
                </p>
              </div>

              {/* 合計問題数重視 */}
              <div
                onClick={() => { sound.playClick(); setGoalType('total_count'); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: goalType === 'total_count' ? '2.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                  background: goalType === 'total_count' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: goalType === 'total_count' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>🎯</span>
                  <strong style={{ fontSize: '15px', color: goalType === 'total_count' ? '#1d4ed8' : '#1e293b' }}>
                    合計問題数重視
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  科目を問わず、1日に解いた全体の合計問題数のみを目標にします。シンプルに続けたい時に最適です。
                </p>
              </div>

              {/* 合計時間重視 */}
              <div
                onClick={() => { sound.playClick(); setGoalType('total_time'); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: goalType === 'total_time' ? '2.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                  background: goalType === 'total_time' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: goalType === 'total_time' ? '0 4px 12px rgba(59,130,246,0.15)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '20px' }}>⏱️</span>
                  <strong style={{ fontSize: '15px', color: goalType === 'total_time' ? '#1d4ed8' : '#1e293b' }}>
                    合計時間重視
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  科目を問わず、1日に机に向かって学習した合計時間を目標にします。学習習慣づくりに最適です。
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="start-btn" onClick={handleNext} style={{ padding: '10px 24px' }}>
                次へ進む ➡️
              </button>
            </div>
          </div>
        )}

        {/* ================= ステップ 2: 動的な目標値入力 ================= */}
        {currentStep === 2 && (
          <div className="wizard-step fade-in">
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              2. 目標値の設定
            </h4>

            {/* 合計問題数重視の場合 */}
            {goalType === 'total_count' && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>
                  🎯 1日の目標問題数：
                </label>
                <select
                  className="profile-input"
                  value={targetQuestions}
                  onChange={(e) => setTargetQuestions(Number(e.target.value))}
                  style={{ maxWidth: '300px' }}
                >
                  <option value={3}>3問（手軽にスタート）</option>
                  <option value={5}>5問（標準おすすめ）</option>
                  <option value={10}>10問（しっかり学習）</option>
                  <option value={15}>15問（たっぷり挑戦）</option>
                  <option value={20}>20問（がっつり達成）</option>
                </select>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  ※ どの科目を解いてもカウントされ、合計でこの問題数を解けばノルマ達成になります。
                </p>
              </div>
            )}

            {/* 合計時間重視の場合 */}
            {goalType === 'total_time' && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>
                  ⏱️ 1日の目標学習時間：
                </label>
                <select
                  className="profile-input"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  style={{ maxWidth: '300px' }}
                >
                  <option value={5}>5分（まずは少しだけ）</option>
                  <option value={10}>10分（標準おすすめ）</option>
                  <option value={15}>15分（しっかり学習）</option>
                  <option value={20}>20分（じっくり挑戦）</option>
                  <option value={30}>30分（集中学習）</option>
                </select>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  ※ 科目を問わず、アプリで学習した合計時間がこの時間に達するとノルマ達成になります。
                </p>
              </div>
            )}

            {/* 科目別目標の場合 */}
            {goalType === 'subject_specific' && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  科目ごとに目標とする「問題数」と「時間」を設定してください。（※片方のみ、または両方設定できます。0にするとその目標は設定されません）
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {SUBJECT_LIST.map(({ key, label, icon }) => {
                    const current = subjectGoals[key];
                    return (
                      <div
                        key={key}
                        style={{
                          background: '#f8fafc',
                          padding: '14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '18px' }}>{icon}</span>
                          <strong style={{ fontSize: '14px', color: '#1e293b' }}>{label}</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                              目標問題数:
                            </label>
                            <input
                              type="number"
                              className="profile-input"
                              style={{ padding: '6px 8px', fontSize: '13px' }}
                              min={0}
                              max={30}
                              placeholder="0問"
                              value={current.targetQuestions === 0 ? '' : current.targetQuestions}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                setSubjectGoals(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], targetQuestions: val }
                                }));
                              }}
                            />
                          </div>

                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                              目標時間(分):
                            </label>
                            <input
                              type="number"
                              className="profile-input"
                              style={{ padding: '6px 8px', fontSize: '13px' }}
                              min={0}
                              max={60}
                              placeholder="0分"
                              value={current.targetMinutes === 0 ? '' : current.targetMinutes}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                setSubjectGoals(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], targetMinutes: val }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 重点科目・単元のオプション設定 */}
                <div style={{ marginTop: '16px', background: '#f1f5f9', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                    💡 重点対象の指定（オプション）:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#475569' }}>重点科目：</label>
                      <select
                        className="profile-input"
                        value={targetSubject}
                        onChange={(e) => setTargetSubject(e.target.value as Subject | 'all')}
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      >
                        <option value="all">指定なし</option>
                        {SUBJECT_LIST.map(s => (
                          <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#475569' }}>重点単元名：</label>
                      <input
                        type="text"
                        className="profile-input"
                        placeholder="例: 一次関数 / 漢字"
                        value={targetUnitName === 'all' ? '' : targetUnitName}
                        onChange={(e) => setTargetUnitName(e.target.value.trim() || 'all')}
                        style={{ padding: '6px 10px', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button type="button" className="cancel-btn" onClick={handleBack} style={{ padding: '10px 20px' }}>
                ⬅️ もどる
              </button>
              <button type="button" className="start-btn" onClick={handleNext} style={{ padding: '10px 24px' }}>
                次へ進む ➡️
              </button>
            </div>
          </div>
        )}

        {/* ================= ステップ 3: 約束・ご褒美の設定と確認 ================= */}
        {currentStep === 3 && (
          <div className="wizard-step fade-in">
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              3. 約束・ご褒美の設定と確認
            </h4>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#334155' }}>
                🎁 達成したときの約束・ご褒美：
              </label>
              <input
                type="text"
                className="profile-input"
                placeholder="例: 🎮 ゲーム30分遊んでOK！"
                value={rewardText}
                onChange={(e) => setRewardText(e.target.value)}
                maxLength={40}
                required
              />

              {/* クイックチップ */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {REWARD_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRewardText(chip)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      color: '#334155',
                      fontWeight: '500'
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 設定内容の確認プレビュー */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1.5px solid #cbd5e1' }}>
              <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '10px' }}>
                📋 設定内容の確認:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
                <li>
                  <strong>目標タイプ:</strong>{' '}
                  {goalType === 'subject_specific' && '📚 科目別目標'}
                  {goalType === 'total_count' && '🎯 合計問題数重視'}
                  {goalType === 'total_time' && '⏱️ 合計時間重視'}
                </li>
                {goalType === 'total_count' && (
                  <li><strong>目標問題数:</strong> {targetQuestions} 問</li>
                )}
                {goalType === 'total_time' && (
                  <li><strong>目標学習時間:</strong> {targetMinutes} 分</li>
                )}
                {goalType === 'subject_specific' && (
                  <li>
                    <strong>科目別目標:</strong>{' '}
                    {SUBJECT_LIST.filter(s => (subjectGoals[s.key].targetQuestions > 0 || subjectGoals[s.key].targetMinutes > 0))
                      .map(s => {
                        const parts = [];
                        if (subjectGoals[s.key].targetQuestions > 0) parts.push(`${subjectGoals[s.key].targetQuestions}問`);
                        if (subjectGoals[s.key].targetMinutes > 0) parts.push(`${subjectGoals[s.key].targetMinutes}分`);
                        return `${s.label} (${parts.join('・')})`;
                      }).join(', ') || '未設定（全体目標を適用）'}
                  </li>
                )}
                <li><strong>達成ご褒美:</strong> {rewardText || '（未入力）'}</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="cancel-btn" onClick={handleBack} style={{ padding: '10px 20px' }}>
                ⬅️ もどる
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {savedToast && <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>✅ {savedToast}</span>}
                <button type="submit" className="start-btn" style={{ padding: '10px 24px' }}>
                  ノルマ・ご褒美を保存する 💾
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
