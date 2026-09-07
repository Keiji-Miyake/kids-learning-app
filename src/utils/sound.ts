// Web Audio API を使用した効果音ジェネレータ
// 外部ファイル読み込み不要で、ブラウザ制限なく確実に動作します。

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // ユーザーインタラクションの後に初期化する
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // 正解音 (ピローン♪)
  public playCorrect() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // ド (C5) -> ソ (G5) の2音
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(783.99, now + 0.12); // G5

    osc2.frequency.setValueAtTime(523.25, now);
    osc2.frequency.setValueAtTime(783.99, now + 0.12);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  // 不正解音 (ブブー)
  public playWrong() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    // 低い音でうねらせる
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.25);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // ボタンクリック音 (プッ)
  public playClick() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // レベルアップ / 全問正解 (ファンファーレ)
  public playLevelUp() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // ド・ミ・ソ・ド〜〜♪ (C5, E5, G5, C6)
    playTone(523.25, now, 0.15); // C5
    playTone(659.25, now + 0.15, 0.15); // E5
    playTone(783.99, now + 0.3, 0.15); // G5
    playTone(1046.50, now + 0.45, 0.6); // C6
  }

  // ショップ購入音 (チャリン)
  public playCoin() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const sound = new SoundManager();
