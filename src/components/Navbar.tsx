import React, { useState } from 'react';
import type { UserStats, UserProfile } from '../types';
import { sound } from '../utils/sound';
import AvatarPreview from './AvatarPreview';

interface NavbarProps {
  stats: UserStats;
  activeProfile: UserProfile;
  onOpenShop: () => void;
  onOpenCollection: () => void;
  onOpenReview: () => void;
  onOpenDashboard: () => void;
  onOpenRoadmap?: () => void;
  onOpenProfileSelector: () => void;
  onLogout?: () => void;
  currentScreen: string;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  activeProfile,
  onOpenShop,
  onOpenCollection,
  onOpenReview,
  onOpenDashboard,
  onOpenRoadmap,
  onOpenProfileSelector,
  onLogout,
  currentScreen,
  onGoHome
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.isEnabled());
  const [menuOpen, setMenuOpen] = useState(false);


  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    sound.playClick();
  };

  const expPercentage = Math.min(100, Math.floor((stats.exp / stats.nextLevelExp) * 100));

  return (
    <header className="navbar-container">
      {/* 1. 左側: アプリロゴ */}
      <div className="navbar-left" onClick={() => { sound.playClick(); onGoHome(); }}>
        <span className="logo-emoji">🚀</span>
        <h1 className="logo-title">LearnQuest</h1>
      </div>

      {/* 2. 中央: 主要ナビゲーションタブ */}
      <nav className="navbar-center">
        <button 
          className={`nav-tab-btn ${currentScreen === 'home' ? 'active' : ''}`}
          onClick={() => { sound.playClick(); onGoHome(); }}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-text">ホーム</span>
        </button>
        {onOpenRoadmap && (
          <button 
            className={`nav-tab-btn ${currentScreen === 'roadmap' ? 'active' : ''}`}
            onClick={() => { sound.playClick(); onOpenRoadmap(); }}
          >
            <span className="tab-icon">🗺️</span>
            <span className="tab-text">ロードマップ</span>
          </button>
        )}
        <button 
          className={`nav-tab-btn ${currentScreen === 'review' ? 'active' : ''}`}
          onClick={() => { sound.playClick(); onOpenReview(); }}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-text">にがてノート</span>
        </button>
        <button 
          className={`nav-tab-btn ${currentScreen === 'collection' ? 'active' : ''}`}
          onClick={() => { sound.playClick(); onOpenCollection(); }}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-text">コレクション</span>
        </button>
        <button 
          className={`nav-tab-btn ${currentScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => { sound.playClick(); onOpenDashboard(); }}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-text">レポート</span>
        </button>

      </nav>

      {/* 3. 右側: ステータス＆統合プロファイル切り替えメニュー */}
      <div className="navbar-right">
        {/* コイン */}
        <div className="nav-stat-chip coin-chip" onClick={() => { sound.playClick(); onOpenShop(); }} title="ショップを開く">
          <span className="chip-emoji">🪙</span>
          <span className="chip-value">{stats.coins}</span>
        </div>

        {/* 連続ストリーク */}
        {stats.streak > 0 && (
          <div className="nav-stat-chip streak-chip" title="連続ログイン日数">
            <span className="chip-emoji">🔥</span>
            <span className="chip-value">{stats.streak}日</span>
          </div>
        )}

        {/* レベル・経験値 */}
        <div className="nav-stat-chip level-chip" title={`EXP: ${stats.exp}/${stats.nextLevelExp}`}>
          <span className="level-badge-text">Lv.{stats.level}</span>
          <div className="mini-exp-bar">
            <div className="mini-exp-fill" style={{ width: `${expPercentage}%` }}></div>
          </div>
        </div>

        {/* サウンド切り替え */}
        <button className="sound-toggle-btn" onClick={toggleSound} title="音のON/OFF">
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* プレイヤープロファイル・ドロップダウンメニュー付きボタン */}
        <div className="profile-dropdown-wrapper" style={{ position: 'relative' }}>
          <button 
            className="profile-selector-btn"
            onClick={() => { sound.playClick(); setMenuOpen(!menuOpen); }}
            title={`${activeProfile.name} さんのメニューを開く`}
          >
            <div className="profile-btn-avatar-wrap">
              <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={activeProfile.avatarEmoji} size="sm" />
            </div>
            <span className="profile-btn-name">{activeProfile.name}</span>
            <span className="switch-icon">{menuOpen ? '▲' : '▼'}</span>
          </button>

          {/* ドロップダウンポップオーバーメニュー */}
          {menuOpen && (
            <>
              <div 
                className="dropdown-backdrop"
                onClick={() => setMenuOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  zIndex: 9998,
                  background: 'rgba(0, 0, 0, 0.05)'
                }}
              />
              <div 
                className="navbar-dropdown-menu slide-down"
                onClick={(e) => e.stopPropagation()}
                style={{ zIndex: 9999 }}
              >

              <div className="dropdown-user-header">
                <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={activeProfile.avatarEmoji} size="md" />
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{activeProfile.name} さん</span>
                  <span className="dropdown-user-level">Lv.{stats.level} / 🪙 {stats.coins} コイン</span>
                </div>
              </div>
              <hr className="dropdown-divider" />

              <div className="dropdown-items">
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onGoHome(); }}>
                  <span>🏠</span> ホーム
                </button>
                {onOpenRoadmap && (
                  <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenRoadmap(); }}>
                    <span>🗺️</span> 学習ロードマップ
                  </button>
                )}
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenReview(); }}>
                  <span>📝</span> にがてノート
                </button>
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenCollection(); }}>
                  <span>🏆</span> コレクション
                </button>
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenShop(); }}>
                  <span>🛒</span> アバターショップ
                </button>
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenDashboard(); }}>
                  <span>📊</span> 保護者レポート・ノルマ
                </button>
                <button className="dropdown-item" onClick={() => { sound.playClick(); setMenuOpen(false); onOpenProfileSelector(); }}>
                  <span>✏️</span> プロフィール編集・設定
                </button>
                
                {onLogout && (
                  <>
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item logout-item" onClick={() => { sound.playClick(); setMenuOpen(false); onLogout(); }}>
                      <span>🚪</span> プレイヤー切替 (ログアウト)
                    </button>
                  </>
                )}

              </div>
            </div>
          </>
          )}
        </div>

      </div>
    </header>
  );
};
export default Navbar;

