import React from 'react';
import { shopItems } from '../data/shopItems';
import type { ShopItem } from '../data/shopItems';
import type { UserStats } from '../types';
import { sound } from '../utils/sound';
import { storage } from '../utils/storage';
import AvatarPreview from './AvatarPreview';

interface ShopModalProps {
  stats: UserStats;
  profileEmoji?: string;
  onUpdateStats: (newStats: UserStats) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  profileEmoji,
  onUpdateStats,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = React.useState<ShopItem['category']>('base');

  const handleBuy = (item: ShopItem) => {
    if (stats.coins < item.price) {
      sound.playWrong();
      alert('コインが足りないよ！クイズを解いて集めよう。');
      return;
    }

    sound.playCoin();

    const updatedStats: UserStats = {
      ...stats,
      coins: stats.coins - item.price,
      ownedItems: [...stats.ownedItems, item.id]
    };

    onUpdateStats(updatedStats);
    storage.saveStats(updatedStats);
  };

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

  const filteredItems = shopItems.filter(item => item.category === activeCategory);

  const getCategoryLabel = (cat: ShopItem['category']) => {
    switch (cat) {
      case 'base': return '🧑‍🚀 キャラクター';
      case 'hat': return '🎓 ぼうし';
      case 'accessory': return '👓 アクセサリー';
      case 'companion': return '🐉 あいぼう';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="shop-card modal-content slide-up">
        <div className="modal-header">
          <div className="shop-header-left">
            <h2>🪙 コインショップ</h2>
            <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={profileEmoji} size="sm" />
          </div>
          <div className="shop-user-coins">
            所持コイン: <span>{stats.coins}</span> 🪙
          </div>
          <button className="close-btn" onClick={() => { sound.playClick(); onClose(); }}>✕</button>
        </div>

        {/* カテゴリー切り替え */}
        <div className="shop-category-tabs">
          {(['base', 'hat', 'accessory', 'companion'] as ShopItem['category'][]).map(cat => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { sound.playClick(); setActiveCategory(cat); }}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* アイテムリスト */}
        <div className="shop-items-grid">
          {filteredItems.map(item => {
            const isOwned = stats.ownedItems.includes(item.id);
            const isEquipped = stats.equippedAvatar[item.category] === item.id;

            return (
              <div key={item.id} className={`shop-item-card ${isEquipped ? 'equipped' : ''}`}>
                <div className="shop-item-emoji">{item.emoji}</div>
                <h4 className="shop-item-name">{item.name}</h4>
                <p className="shop-item-desc">{item.description}</p>
                
                <div className="shop-item-action">
                  {isEquipped ? (
                    <span className="badge-equipped">そうび中</span>
                  ) : isOwned ? (
                    <button className="equip-btn" onClick={() => handleEquip(item)}>
                      そうびする
                    </button>
                  ) : (
                    <button className="buy-btn" onClick={() => handleBuy(item)}>
                      <span className="price-tag">{item.price} 🪙</span> で買う
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default ShopModal;
