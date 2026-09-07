import React, { useEffect, useState } from 'react';
import type { Subject, UserProfile, SemesterSystem } from '../types';
import { sound } from '../utils/sound';
import { getCurriculumUnits, getDisplayTerm, type CurriculumUnit } from '../data/curriculumLOD';
import { fetchCompletedUnits, getLocalCompletedUnits } from '../data/progress';

export const calculateUnitStatus = (unitCode: string, completedUnits: string[]): 'mastered' | 'in-progress' | 'locked' => {
  if (completedUnits.includes(unitCode)) {
    return 'mastered';
  }
  return 'locked';
};

interface RoadmapScreenProps {
  profile: UserProfile;
  onSelectUnitQuiz: (subject: Subject, grade: number, unit: CurriculumUnit) => void;
  onStartUnitExam?: (subject: Subject, grade: number, unit: CurriculumUnit) => void;
  onClose: () => void;
}


export const RoadmapScreen: React.FC<RoadmapScreenProps> = ({
  profile,
  onSelectUnitQuiz,
  onStartUnitExam,
  onClose
}) => {

  const [selectedSubject, setSelectedSubject] = useState<Subject>('math');
  const [selectedGrade, setSelectedGrade] = useState<number>(profile.grade || 3);
  const [completedUnits, setCompletedUnits] = useState<string[]>(() => getLocalCompletedUnits(profile.id));
  const [viewSemesterSystem, setViewSemesterSystem] = useState<SemesterSystem>(
    profile.semesterSystem || '3-term'
  );

  useEffect(() => {
    let isMounted = true;
    fetchCompletedUnits(profile.id).then(units => {
      if (isMounted) setCompletedUnits(units);
    });
    return () => { isMounted = false; };
  }, [profile.id]);

  const units = getCurriculumUnits(selectedSubject, selectedGrade);
  const clearedCount = units.filter((u) => calculateUnitStatus(u.code, completedUnits) === 'mastered').length;
  const progressPercent = units.length > 0 ? Math.round((clearedCount / units.length) * 100) : 0;

  const subjects: { id: Subject; name: string; emoji: string }[] = [
    { id: 'math', name: '算数・数学', emoji: '🧮' },
    { id: 'japanese', name: '国語', emoji: '📖' },
    { id: 'science', name: '理科', emoji: '🧪' },
    { id: 'social', name: '社会', emoji: '🗺' },
    { id: 'english', name: '英語', emoji: '🔤' }
  ];

  return (
    <div className="roadmap-modal-overlay fade-in">
      <div className="roadmap-container card">
        <div className="roadmap-header">
          <div className="roadmap-title-wrap">
            <span className="roadmap-emoji">🗺️</span>
            <div>
              <h2>学習ロードマップ ＆ カリキュラム進捗</h2>
              <p>文部科学省の学習指導要領に基づく1年間の学習ロードマップです。</p>
            </div>
          </div>
          <button className="close-btn" onClick={() => { sound.playClick(); onClose(); }}>✕</button>
        </div>

        {/* コントロール: 教科 ＆ 学年 */}
        <div className="roadmap-controls">
          <div className="subject-tabs">
            {subjects.map(s => (
              <button
                key={s.id}
                className={`subject-tab ${selectedSubject === s.id ? 'active' : ''}`}
                onClick={() => { sound.playClick(); setSelectedSubject(s.id); }}
              >
                <span>{s.emoji}</span>
                <span>{s.name}</span>
              </button>
            ))}
          </div>

          <div className="roadmap-grade-select">
            <label>対象学年：</label>
            <select
              value={selectedGrade}
              onChange={(e) => { sound.playClick(); setSelectedGrade(Number(e.target.value)); }}
            >
              <option value={1}>小学1年</option>
              <option value={2}>小学2年</option>
              <option value={3}>小学3年</option>
              <option value={4}>小学4年</option>
              <option value={5}>小学5年</option>
              <option value={6}>小学6年</option>
              <option value={7}>中学1年</option>
              <option value={8}>中学2年</option>
              <option value={9}>中学3年</option>
            </select>
          </div>

          <div className="roadmap-semester-toggle">
            <label>学期表示：</label>
            <div className="semester-toggle-group">
              <button
                type="button"
                className={`semester-toggle-btn ${viewSemesterSystem === '3-term' ? 'active' : ''}`}
                onClick={() => { sound.playClick(); setViewSemesterSystem('3-term'); }}
              >
                3学期制
              </button>
              <button
                type="button"
                className={`semester-toggle-btn ${viewSemesterSystem === '2-term' ? 'active' : ''}`}
                onClick={() => { sound.playClick(); setViewSemesterSystem('2-term'); }}
              >
                2学期制
              </button>
            </div>
          </div>
        </div>

        {/* 全体達成度プログレスバー */}
        <div className="roadmap-overall-progress">
          <div className="progress-info">
            <span>年間達成度：<strong>{clearedCount} / {units.length} 単元クリア</strong></span>
            <span className="percent-text">{progressPercent}% 達成</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        {/* 🗺️ ロードマップ ステージツリー */}
        <div className="roadmap-tree">
          {units.map((unit) => {
            const status = calculateUnitStatus(unit.code, completedUnits);
            return (
              <div 
                key={unit.code} 
                className={`roadmap-node ${status}`}
                onClick={() => {
                  sound.playClick();
                  onSelectUnitQuiz(selectedSubject, selectedGrade, unit);
                }}
              >
                <div className="roadmap-node-top">
                  <div className="node-badge">
                    {status === 'mastered' ? '👑' : '📖'}
                  </div>
                  <div className="node-content">
                    <div className="node-header">
                      <span className="node-term">{getDisplayTerm(unit, viewSemesterSystem)}</span>
                      <span className="node-code">LOD: {unit.code}</span>
                    </div>
                    <h4 className="node-title">{unit.unitName}</h4>
                    <p className="node-desc">{unit.description}</p>
                  </div>
                </div>
                <div className="node-actions">
                  <button className="node-start-btn" onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    onSelectUnitQuiz(selectedSubject, selectedGrade, unit);
                  }}>
                    {status === 'mastered' ? '復習クイズ ▶' : '練習クイズ ▶'}
                  </button>
                  {onStartUnitExam && (
                    <button className="node-exam-btn" onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onStartUnitExam(selectedSubject, selectedGrade, unit);
                    }}>
                      📝 単元テスト ▶
                    </button>
                  )}
                </div>
              </div>

            );
          })}
        </div>


        <div className="roadmap-footer">
          <button className="back-home-btn" onClick={() => { sound.playClick(); onClose(); }}>
            メニューにもどる 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
export default RoadmapScreen;
