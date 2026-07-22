interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
}

export class ConfettiEffect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private active: boolean = false;
  private animationId: number | null = null;
  private colors = [
    '#FF3366', '#FF9933', '#FFCC33', '#33CC66', 
    '#3399FF', '#9933FF', '#FF33CC', '#33FFCC'
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');
    this.ctx = context;
    this.resize();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.resize();
  };

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
  }

  private createParticle(): Particle {
    return {
      x: Math.random() * this.canvas.width,
      y: -20,
      size: Math.random() * 8 + 6,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      speedX: Math.random() * 4 - 2,
      speedY: Math.random() * 4 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2
    };
  }

  public start(durationMs: number = 3000) {
    if (this.active) return;
    this.active = true;
    this.particles = [];
    this.resize();

    // 初期粒子を一気に生成
    for (let i = 0; i < 150; i++) {
      const p = this.createParticle();
      p.y = Math.random() * this.canvas.height; // 画面全体に散らす
      this.particles.push(p);
    }

    this.animate();

    setTimeout(() => {
      this.stop();
    }, durationMs);
  }

  public stop() {
    this.active = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private animate = () => {
    if (!this.active && this.particles.length === 0) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 新しい粒子を少しずつ追加（アクティブな間のみ）
    if (this.active && this.particles.length < 150 && Math.random() < 0.4) {
      this.particles.push(this.createParticle());
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotationSpeed;

      // 画面外に出た粒子を削除
      if (p.y > this.canvas.height || p.x < -20 || p.x > this.canvas.width + 20) {
        if (this.active) {
          // 再利用
          this.particles[i] = this.createParticle();
        } else {
          // 終了中なら消すだけ
          this.particles.splice(i, 1);
          continue;
        }
      }

      // 描画
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    this.animationId = requestAnimationFrame(this.animate);
  };
}
