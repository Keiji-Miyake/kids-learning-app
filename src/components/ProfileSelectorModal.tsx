import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { storage } from '../utils/storage';
import { sound } from '../utils/sound';
import { haptics } from '../utils/haptics';
import AvatarPreview from './AvatarPreview';

interface ProfileSelectorModalProps {
  onSelectProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const canDeleteProfile = (activeId: string, targetId: string, totalProfilesCount: number): boolean => {
  if (totalProfilesCount <= 1) return false;
  return activeId === targetId;
};

export const canEditProfile = (activeId: string, targetId: string): boolean => {
  return activeId === targetId;
};

export const canAddProfile = (inputPassword: string): boolean => {
  return storage.verifyParentPassword(inputPassword);
};




export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  onSelectProfile,
  onClose
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(storage.getProfiles());
  const [activeId, setActiveId] = useState<string>(storage.getActiveProfileId());
  
  // モード: 'list' | 'pin-verify' | 'add' | 'edit' | 'auth_add'
  const [mode, setMode] = useState<'list' | 'pin-verify' | 'add' | 'edit' | 'auth_add'>('list');
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  
  // PIN入力用
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // 保護者認証用 (プロフィール追加制限)
  const [parentPasswordInput, setParentPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 編集用フォームステート
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('👦');
  const [editGrade, setEditGrade] = useState<number>(3);
  const [editPin, setEditPin] = useState('');

  const avatarOptions = [
    '👦', '👧', '👶', '🧑‍🚀', '👩‍🚀', '🤖', '🐱', '🐶',
    '🦊', '🦁', '🐯', '🐼', '🐰', '🦄', '🐲', '🚀', '👑', '⭐', '⚽', '🎨'
  ];

  const getGradeLabel = (g?: number) => {
    const gradeNum = g || 3;
    if (gradeNum <= 6) return `小学${gradeNum}年`;
    return `中学${gradeNum - 6}年`;
  };

  const handleCardClick = (profile: UserProfile) => {
    sound.playClick();
    if (profile.pin) {
      setTargetProfile(profile);
      setEnteredPin('');
      setPinError(false);
      setMode('pin-verify');
    } else {
      loginAs(profile);
    }
  };

  const loginAs = (profile: UserProfile) => {
    storage.setActiveProfileId(profile.id);
    setActiveId(profile.id);
    onSelectProfile(profile);
    onClose();
  };

  const handleKeypadPress = (num: string) => {
    sound.playClick();
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setPinError(false);

      if (nextPin.length === 4 && targetProfile) {
        if (nextPin === targetProfile.pin) {
          sound.playCorrect();
          haptics.vibrateCorrect();
          loginAs(targetProfile);
        } else {
          sound.playWrong();
          haptics.vibrateWrong();
          setPinError(true);
          setTimeout(() => setEnteredPin(''), 600);
        }
      }
    }
  };

  const handleKeypadClear = () => {
    sound.playClick();
    setEnteredPin('');
    setPinError(false);
  };

  const handleOpenEdit = (e: React.MouseEvent, profile: UserProfile) => {
    e.stopPropagation();
    if (!canEditProfile(activeId, profile.id)) {
      alert('他人のプロフィールは編集できません！自分のプロフィールのみ編集できます。');
      return;
    }
    sound.playClick();
    setTargetProfile(profile);
    setEditName(profile.name);
    setEditEmoji(profile.avatarEmoji);
    setEditGrade(profile.grade || 3);
    setEditPin(profile.pin || '');
    setMode('edit');
  };


  const handleOpenAdd = () => {
    sound.playClick();
    setParentPasswordInput('');
    setAuthError('');
    setMode('auth_add');
  };

  const handleVerifyParentPasswordForAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const isValid = await storage.verifyParentPasswordAsync(parentPasswordInput);
    if (!isValid) {
      sound.playWrong();
      haptics.vibrateWrong();
      setAuthError('❌ 保護者パスワードが正しくありません。');
      return;
    }
    sound.playCorrect();
    setEditName('');
    setEditEmoji('👦');
    setEditGrade(3);
    setEditPin('');
    setMode('add');
  };


  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    sound.playClick();
    const created = storage.createProfile(editName, editEmoji, editGrade, editPin.trim() || undefined);
    setProfiles(storage.getProfiles());
    setMode('list');
    loginAs(created);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile || !editName.trim()) return;
    sound.playClick();

    const updated: UserProfile = {
      ...targetProfile,
      name: editName.trim(),
      avatarEmoji: editEmoji,
      grade: editGrade,
      pin: editPin.trim() ? editPin.trim() : undefined
    };

    storage.updateProfile(updated);
    const updatedProfiles = storage.getProfiles();
    setProfiles(updatedProfiles);
    setMode('list');

    if (activeId === updated.id) {
      onSelectProfile(updated);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canDeleteProfile(activeId, id, profiles.length)) {
      alert('他人のプロファイルは削除できません！自分のプロファイルのみ削除できます。');
      return;
    }
    if (confirm('このプロファイルを削除してもよろしいですか？')) {
      sound.playClick();
      storage.deleteProfile(id);
      const updated = storage.getProfiles();
      setProfiles(updated);
      if (activeId === id) {
        setActiveId(updated[0].id);
        onSelectProfile(updated[0]);
      }
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content profile-modal slide-up">
        <div className="modal-header">
          <h2>👨‍👩‍👧‍👦 家族のプロファイル切替＆設定</h2>
          <button className="close-btn" onClick={() => { sound.playClick(); onClose(); }}>✕</button>
        </div>

        {/* 1. プロファイル一覧表示モード */}
        {mode === 'list' && (
          <div className="profile-selector-body">
            <p className="profile-instruction">だれが冒険するかな？自分のなまえをえらんでね！</p>

            <div className="profiles-grid">
              {profiles.map(p => {
                const isActive = p.id === activeId;
                const stats = storage.getStats(p.id);

                return (
                  <div
                    key={p.id}
                    className={`profile-card ${isActive ? 'active' : ''} ${p.pin ? 'pin-protected' : ''}`}
                    onClick={() => handleCardClick(p)}
                  >
                    {/* 鍵保護マーク */}
                    {p.pin ? (
                      <span className="pin-lock-badge" title="暗証番号（PIN）保護中">🔒 ロック中</span>
                    ) : (
                      <span className="pin-lock-badge unlocked" title="ロックなし">🔓</span>
                    )}

                    <div className="profile-avatar-wrap">
                      <AvatarPreview equipped={stats.equippedAvatar} profileEmoji={p.avatarEmoji} size="md" />
                    </div>
                    <h3 className="profile-name">{p.name}</h3>
                    <div className="profile-grade-tag">🎓 {getGradeLabel(p.grade)}</div>

                    <div className="profile-stats-mini">
                      <span className="profile-level">Lv.{stats.level}</span>
                      <span className="profile-coins">🪙 {stats.coins}</span>
                    </div>
                    
                    {isActive && <span className="active-tag">いまのプレイヤー</span>}
                    
                    <div className="profile-card-actions">
                      {canEditProfile(activeId, p.id) && (
                        <button
                          className="profile-edit-btn"
                          onClick={(e) => handleOpenEdit(e, p)}
                          title="アイコン・名前・学年・暗証番号を変更"
                        >
                          ✏️ 編集
                        </button>
                      )}

                      {canDeleteProfile(activeId, p.id, profiles.length) && (

                        <button
                          className="delete-profile-btn"
                          onClick={(e) => handleDelete(e, p.id)}
                          title="プロファイルを削除"
                        >
                          🗑️ 削除
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

            <button className="add-profile-btn" onClick={handleOpenAdd}>
              ＋ あたらしい家族・プレイヤーを追加する
            </button>
          </div>
        )}

        {/* 2. PINコード入力認証画面（テンキー） */}
        {mode === 'pin-verify' && targetProfile && (
          <div className="profile-selector-body pin-verify-container fade-in">
            <div className="pin-target-header">
              <div className="pin-avatar-wrap" style={{ width: '70px', height: '70px', margin: '0 auto 12px auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AvatarPreview equipped={storage.getStats(targetProfile.id).equippedAvatar} profileEmoji={targetProfile.avatarEmoji} size="md" />
              </div>
              <h3>{targetProfile.name} さんのロックキー</h3>
              <p>4桁の暗証番号（PIN）を入力してね！</p>
            </div>

            <div className={`pin-display ${pinError ? 'shake error' : ''}`}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot ${i < enteredPin.length ? 'filled' : ''}`} />
              ))}
            </div>

            {pinError && <p className="pin-error-text">❌ 暗証番号がちがいます！</p>}

            <div className="pin-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map((key) => {
                if (key === 'C') {
                  return (
                    <button key={key} className="keypad-btn clear" onClick={handleKeypadClear}>
                      クリア
                    </button>
                  );
                }
                if (key === '✕') {
                  return (
                    <button key={key} className="keypad-btn back" onClick={() => setMode('list')}>
                      もどる
                    </button>
                  );
                }
                return (
                  <button key={key} className="keypad-btn" onClick={() => handleKeypadPress(key)}>
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. 新規アカウント追加モード */}
        {mode === 'add' && (
          <form className="add-profile-form card fade-in" onSubmit={handleSaveAdd}>
            <h4>➕ 新しいプレイヤーの追加</h4>
            <div className="form-group">
              <label>おなまえ：</label>
              <input
                type="text"
                className="profile-input"
                placeholder="例: たろう"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>がくねん（学年）：</label>
              <select
                className="profile-input"
                value={editGrade}
                onChange={(e) => setEditGrade(Number(e.target.value))}
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
              <span className="form-hint">※ここで設定した学年がクイズ選択時に自動でセットされます。</span>
            </div>

            <div className="form-group">
              <label>アイコンを選ぶ：</label>
              <div className="emoji-picker">
                {avatarOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${editEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setEditEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>暗証番号（PIN 4桁 / 任意）：</label>
              <input
                type="password"
                className="profile-input"
                placeholder="例: 1234 (空欄でロックなし)"
                value={editPin}
                maxLength={4}
                onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
              />
              <span className="form-hint">※他の人に勝手に選ばれたくない場合は4桁の暗証番号を設定できます。</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="start-btn">追加してスタート！</button>
              <button type="button" className="cancel-btn" onClick={() => setMode('list')}>キャンセル</button>
            </div>
          </form>
        )}

        {/* 4. プロファイル編集モード（アイコン・学年・名前・PIN変更） */}
        {mode === 'edit' && targetProfile && (
          <form className="add-profile-form card fade-in" onSubmit={handleSaveEdit}>
            <h4>✏️ {targetProfile.name} さんの設定変更</h4>

            <div className="form-group">
              <label>おなまえ：</label>
              <input
                type="text"
                className="profile-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={10}
                required
              />
            </div>

            <div className="form-group">
              <label>がくねん（学年）：</label>
              <select
                className="profile-input"
                value={editGrade}
                onChange={(e) => setEditGrade(Number(e.target.value))}
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
              <span className="form-hint">※ここで設定した学年がクイズ選択時に自動でセットされます。</span>
            </div>

            <div className="form-group">
              <label>アイコン（好きな絵文字を選ぶ）：</label>
              <div className="emoji-picker">
                {avatarOptions.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${editEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setEditEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>暗証番号（PIN 4桁 / 任意）：</label>
              <input
                type="password"
                className="profile-input"
                placeholder="空欄にするとロック解除"
                value={editPin}
                maxLength={4}
                onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
              />
              <span className="form-hint">※4桁の数字を入れるとロックが有効になります。空欄でロック解除。</span>
            </div>

            <div className="form-actions">
              <button type="submit" className="start-btn">変更を保存する</button>
              <button type="button" className="cancel-btn" onClick={() => setMode('list')}>キャンセル</button>
            </div>
          </form>
        )}

        {/* 2.5 保護者認証モード (プロフィール追加時のパスワード入力 / マスク対応) */}
        {mode === 'auth_add' && (
          <form className="add-profile-form card fade-in" onSubmit={handleVerifyParentPasswordForAdd}>
            <h4>🔑 保護者確認</h4>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              新しいプレイヤーを追加するには、保護者マスターパスワードを入力してください。
            </p>

            <div className="form-group">
              <label>保護者パスワード：</label>
              <input
                type="password"
                className="profile-input"
                placeholder="パスワードを入力 (初期値: parent)"
                value={parentPasswordInput}
                onChange={(e) => {
                  setParentPasswordInput(e.target.value);
                  setAuthError('');
                }}
                autoFocus
                required
              />
              {authError && <p className="pin-error-text" style={{ marginTop: '8px' }}>{authError}</p>}
            </div>

            <div className="form-actions">
              <button type="submit" className="start-btn">認証して進む</button>
              <button type="button" className="cancel-btn" onClick={() => setMode('list')}>キャンセル</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default ProfileSelectorModal;
