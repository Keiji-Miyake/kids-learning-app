import React from 'react';
import { badges, shopItems } from '../data/shopItems';
import type { ShopItem } from '../data/shopItems';
import type { UserStats } from '../types';
import { sound } from '../utils/sound';
import { storage } from '../utils/storage';
import AvatarPreview from './AvatarPreview';

interface CollectionScreenProps {
  stats: UserStats;
  profileEmoji?: string;
  onUpdateStats: (newStats: UserStats) => void;
  onClose: () => void;
}

export const CollectionScreen: React.FC<CollectionScreenProps> = ({
  stats,
  profileEmoji,
  onUpdateStats,
  onClose
}) => {


  const handleEquip = (item: ShopItem) => {
    sound.playClick();
    const newEquipped = { ...stats.equippedAvatar };
    newEquipped[item.category] = item.id;

    const updatedStats: UserStats = {
      ...stats,
      equippedAvatar: newEquipped
    };

    onUpdateStats(updatedStats);
    storage.saveStats(updatedStats);
  };

  const myOwnedItems = shopItems.filter(item => stats.ownedItems.includes(item.id));

  return (
    <div className="collection-screen-container fade-in">
      <div className="collection-layout">
        {/* 左側：アバタープレビュー＆クローゼット */}
        <div className="avatar-preview-section">
          <h2 className="section-title">🧑‍🚀 現在のすがた</h2>
          
          <div className="avatar-canvas-preview">
            <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={profileEmoji} size="lg" />
          </div>

          <div className="closet-container">
            <h3 className="closet-title">👕 クローゼット（持ちもの）</h3>
            <div className="closet-grid">
              {myOwnedItems.map(item => {
                const isEquipped = stats.equippedAvatar[item.category] === item.id;
                return (
                  <button
                    key={item.id}
                    className={`closet-item ${isEquipped ? 'equipped' : ''}`}
                    onClick={() => handleEquip(item)}
                    title={`${item.name}をそうびする`}
                  >
                    <span className="closet-emoji">{item.emoji}</span>
                    <span className="closet-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右側：バッジ（アチーブメント）一覧 */}
        <div className="badges-section">
          <h2 className="section-title">🏆 獲得したバッジ</h2>
          <div className="badges-list">
            {badges.map(badge => {
              const isUnlocked = stats.unlockedBadges.includes(badge.id);

              return (
                <div key={badge.id} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                  <div className="badge-emoji">{isUnlocked ? badge.emoji : '🔒'}</div>
                  <div className="badge-details">
                    <h4 className="badge-name">{badge.name}</h4>
                    <p className="badge-desc">{badge.description}</p>
                    <span className="badge-req">条件: {badge.requirement}</span>
                  </div>
                  {isUnlocked && <span className="badge-check">✅</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="collection-footer">
        <button className="back-home-btn" onClick={() => { sound.playClick(); onClose(); }}>
          メニューにもどる 🏠
        </button>
      </div>
    </div>
  );
};
export default CollectionScreen;
