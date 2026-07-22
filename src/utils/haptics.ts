// Androidスマホ等のバイブレーション（Haptic Feedback）制御

class HapticsManager {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 軽いタップ振動 (ポチッ)
  public vibrateLight() {
    if (!this.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // セキュリティ制約などで失敗した場合は無視
      }
    }
  }

  // 正解時の振動 (トントンッ)
  public vibrateCorrect() {
    if (!this.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {
        // 無視
      }
    }
  }

  // 不正解時の振動 (ブルルッ)
  public vibrateWrong() {
    if (!this.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 50, 100]);
      } catch (e) {
        // 無視
      }
    }
  }

  // レベルアップ時の振動 (パタパタパタパタッ！)
  public vibrateLevelUp() {
    if (!this.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([50, 30, 50, 30, 50, 30, 150]);
      } catch (e) {
        // 無視
      }
    }
  }
}

export const haptics = new HapticsManager();
