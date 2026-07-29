import React from 'react';
import type { UserStats } from '../types';
import { shopItems } from '../data/shopItems';

interface AvatarPreviewProps {
  equipped: UserStats['equippedAvatar'];
  profileEmoji?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  equipped,
  profileEmoji,
  size = 'md',
  className = '',
  onClick
}) => {
  const getEmoji = (category: keyof typeof equipped) => {
    const id = equipped[category];
    const item = shopItems.find(i => i.id === id);
    if (!item || item.emoji === '❌') return null;
    return item.emoji;
  };

  // ショップ/コレクションで装備中のベースアイテムを取得
  const equippedBaseItem = shopItems.find(i => i.id === equipped?.base);
  const isDefaultBase = !equipped?.base || equipped.base === 'base-boy' || equipped.base === 'base-girl';
  
  // プロファイルアイコン(profileEmoji)がある場合は初期・デフォルトアバターにおいてそれを優先表示
  // ショップで特別なアバター（ロボ・ネコ等）を装備した場合のみそちらを表示
  const baseEmoji = (profileEmoji && isDefaultBase)
    ? profileEmoji
    : (equippedBaseItem?.emoji || profileEmoji || '🧑‍🚀');

  const hatEmoji = getEmoji('hat');
  const accessoryEmoji = getEmoji('accessory');
  const companionEmoji = getEmoji('companion');

  return (
    <div className={`avatar-preview-container avatar-size-${size} ${className}`} onClick={onClick}>
      {/* 相棒ペット */}
      {companionEmoji && (
        <span className="avatar-layer companion-layer bounce-anim" title="あいぼう">
          {companionEmoji}
        </span>
      )}
      
      {/* アバターベース本体 (元気な少年/活発な少女/ロボ/ネコ等に完全連動) */}
      <span className="avatar-layer base-layer">
        {baseEmoji}
      </span>
      
      {/* 帽子 */}
      {hatEmoji && (
        <span className="avatar-layer hat-layer">
          {hatEmoji}
        </span>
      )}
      
      {/* アクセサリー (めがね、星、メダル) */}
      {accessoryEmoji && (
        <span className="avatar-layer accessory-layer">
          {accessoryEmoji}
        </span>
      )}
    </div>
  );
};
export default AvatarPreview;
