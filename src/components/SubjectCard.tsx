import React, { useEffect, useState } from 'react';
import type { Subject, SemesterSystem } from '../types';
import { sound } from '../utils/sound';
import { getCurriculumUnits, getDisplayTerm, type CurriculumUnit } from '../data/curriculumLOD';

interface SubjectCardProps {
  id: Subject;
  title: string;
  emoji: string;
  colorClass: string;
  description: string;
  defaultGrade?: number;
  semesterSystem?: SemesterSystem;
  onSelect: (subject: Subject, grade: number, unit?: CurriculumUnit) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  id,
  title,
  emoji,
  colorClass,
  description,
  defaultGrade = 3,
  semesterSystem,
  onSelect
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(defaultGrade);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);
  const [showFullUnitList, setShowFullUnitList] = useState<boolean>(false);

  useEffect(() => {
    setSelectedGrade(defaultGrade);
    setSelectedUnitIndex(0);
  }, [defaultGrade]);

  const units = getCurriculumUnits(id, selectedGrade);
  const currentUnit = units[selectedUnitIndex] || units[0];

  const handleStart = () => {
    sound.playClick();
    onSelect(id, selectedGrade, currentUnit);
  };

  return (
    <div className={`subject-card ${colorClass}`}>
      <div className="card-header">
        <span className="subject-emoji">{emoji}</span>
        <h3 className="subject-title">{title}</h3>
      </div>
      <p className="subject-desc">{description}</p>
      
      <div className="grade-selector-container">
        <label htmlFor={`grade-select-${id}`} className="grade-label">学年を選ぶ：</label>
        <select 
          id={`grade-select-${id}`} 
          className="grade-select"
          value={selectedGrade}
          onChange={(e) => {
            setSelectedGrade(Number(e.target.value));
            setSelectedUnitIndex(0);
          }}
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

      {/* 📚 文部科学省「学習指導要領LOD」準拠 1年間全単元表示 */}
      {units.length > 0 && (
        <div className="lod-curriculum-badge">
          <div className="lod-badge-header">
            <span className="lod-tag">🏛️ 文部科学省 学習指導要領 (年間{units.length}単元)</span>
            <button 
              type="button"
              className="lod-toggle-btn"
              onClick={() => setShowFullUnitList(!showFullUnitList)}
            >
              {showFullUnitList ? '閉じる 🔼' : '年間単元一覧 🔽'}
            </button>
          </div>

          {/* 選択中の単元ドロップダウンまたは詳細表示 */}
          <div className="unit-select-wrap">
            <label className="unit-select-label">挑戦する単元：</label>
            <select
              className="unit-select"
              value={selectedUnitIndex}
              onChange={(e) => setSelectedUnitIndex(Number(e.target.value))}
            >
              {units.map((u, idx) => (
                <option key={u.code} value={idx}>
                  {`[${getDisplayTerm(u, semesterSystem)}] `}{u.unitName}
                </option>
              ))}
            </select>
          </div>

          {currentUnit && (
            <div className="lod-unit-detail">
              <span className="lod-unit-title">【目標】{currentUnit.unitName}</span>
              <p className="lod-unit-desc">{currentUnit.description}</p>
            </div>
          )}

          {/* 年間全単元アコーディオン表示 */}
          {showFullUnitList && (
            <div className="full-unit-list fade-in">
              <h5 className="full-unit-list-title">1年間で学習する全単元リスト：</h5>
              <ul>
                {units.map((u, i) => (
                  <li 
                    key={u.code} 
                    className={`unit-list-item ${i === selectedUnitIndex ? 'active' : ''}`}
                    onClick={() => { setSelectedUnitIndex(i); sound.playClick(); }}
                  >
                    <span className="unit-item-term">{getDisplayTerm(u, semesterSystem)}</span>
                    <span className="unit-item-name">{u.unitName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button className="start-btn" onClick={handleStart}>
        学習をはじめる！ 📚
      </button>
    </div>
  );
};
export default SubjectCard;
