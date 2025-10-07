import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.createProceduralTextures();
    this.createEnemySpritesheets();
    this.createParticleTexture();
    this.createSynthSounds();
  }

  create(): void {
    this.scene.start('game');
  }

  private createProceduralTextures(): void {
    this.createPlayerTexture();
    this.createTrunkTexture();
    this.createBranchTexture();
    this.createFruitTexture();
    this.createGoalBannerTexture();
    this.createBackgroundTexture();
  }

  private createPlayerTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xf2d5a3);
    g.fillRect(2, 0, 12, 6);
    g.fillStyle(0x482f1b);
    g.fillRect(2, 0, 12, 2);
    g.fillStyle(0xd12f2f);
    g.fillRect(0, 6, 16, 8);
    g.fillStyle(0x1f7f1f);
    g.fillRect(2, 14, 5, 10);
    g.fillRect(9, 14, 5, 10);
    g.fillStyle(0x472b13);
    g.fillRect(2, 24, 5, 3);
    g.fillRect(9, 24, 5, 3);
    g.fillStyle(0xf2d5a3);
    g.fillRect(0, 10, 4, 6);
    g.fillRect(12, 10, 4, 6);
    g.generateTexture('player', 16, 28);
    g.destroy();
  }

  private createTrunkTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x7f3f15);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0x9f5f2f);
    g.beginPath();
    g.moveTo(16, 0);
    g.lineTo(8, 64);
    g.moveTo(32, 0);
    g.lineTo(26, 64);
    g.moveTo(48, 0);
    g.lineTo(40, 64);
    g.strokePath();
    g.generateTexture('trunk', 64, 64);
    g.destroy();
  }

  private createBranchTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x5b2f0a);
    g.fillRect(0, 4, 64, 8);
    g.fillStyle(0x1f7f1f);
    g.fillRect(0, 0, 64, 6);
    g.fillRect(0, 12, 64, 6);
    g.generateTexture('branch', 64, 18);
    g.destroy();
  }

  private createFruitTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffc300);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0x1f7f1f);
    g.fillRect(7, 0, 2, 4);
    g.generateTexture('fruit', 16, 16);
    g.destroy();
  }

  private createGoalBannerTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffe17a);
    g.fillRect(0, 0, 84, 9);
    g.fillStyle(0xc87b1d);
    g.fillRect(0, 7, 84, 2);
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(4, 1, 12, 4);
    g.generateTexture('goal-banner', 84, 9);
    g.destroy();
  }

  private createBackgroundTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x001024);
    g.fillRect(0, 0, 256, 256);
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 60; i += 1) {
      const x = Phaser.Math.Between(0, 255);
      const y = Phaser.Math.Between(0, 255);
      g.fillRect(x, y, 1, 1);
    }
    g.generateTexture('sky', 256, 256);
    g.destroy();
  }

  private createEnemySpritesheets(): void {
    this.createSpriteSheet('enemy-condor', 24, 18, 3, (ctx, frame) => {
      ctx.fillStyle = '#27406b';
      ctx.beginPath();
      ctx.moveTo(4, 10);
      ctx.quadraticCurveTo(12, 2 + frame, 20, 10);
      ctx.lineTo(20, 12);
      ctx.quadraticCurveTo(12, 6 + frame, 4, 12);
      ctx.fill();
      ctx.fillStyle = '#f2d5a3';
      ctx.fillRect(10, 6, 4, 3);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(9, 6, 2, 2);
    });

    this.createSpriteSheet('enemy-scorpion', 18, 14, 4, (ctx, frame) => {
      ctx.fillStyle = '#30110a';
      ctx.fillRect(2, 6, 14, 6);
      ctx.fillStyle = '#6e2d1b';
      ctx.fillRect(3, 7, 12, 4);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(2 + (frame % 2), 5, 6, 3);
      ctx.fillRect(10 - (frame % 2), 5, 6, 3);
      ctx.strokeStyle = '#a55824';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.lineTo(3, 2 + (frame % 2));
      ctx.moveTo(14, 6);
      ctx.lineTo(15, 2 + ((frame + 1) % 2));
      ctx.stroke();
    });

    this.createSpriteSheet('enemy-monkey', 20, 20, 4, (ctx, frame) => {
      ctx.fillStyle = '#4a2b0f';
      ctx.fillRect(4, 8, 12, 8);
      ctx.fillStyle = '#d79c62';
      ctx.fillRect(7, 10, 6, 6);
      ctx.fillStyle = '#f2d5a3';
      ctx.fillRect(8, 4, 4, 4);
      ctx.fillRect(6, 12, 3, 5);
      ctx.fillRect(11, 12, 3, 5);
      ctx.fillStyle = '#4a2b0f';
      ctx.fillRect(4 + (frame % 2), 6, 2, 6);
      ctx.fillRect(14 - (frame % 2), 6, 2, 6);
    });

    this.createSpriteSheet('enemy-snake', 20, 16, 4, (ctx, frame) => {
      ctx.fillStyle = '#1f7f1f';
      ctx.fillRect(2, 8, 16, 4);
      ctx.fillStyle = '#0c4010';
      ctx.fillRect(4, 6, 12, 3);
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(12 + (frame % 2), 6, 2, 2);
      ctx.fillStyle = '#27406b';
      ctx.fillRect(10, 4 - (frame % 2), 4, 4);
    });

    this.createSpriteSheet('enemy-spider', 16, 18, 4, (ctx, frame) => {
      ctx.fillStyle = '#2b213d';
      ctx.beginPath();
      ctx.arc(8, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe082';
      ctx.fillRect(6, 6, 2, 2);
      ctx.fillRect(9, 6, 2, 2);
      ctx.strokeStyle = '#473a6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 10);
      ctx.lineTo(0, 6 + (frame % 2));
      ctx.moveTo(4, 12);
      ctx.lineTo(0, 14 - (frame % 2));
      ctx.moveTo(12, 10);
      ctx.lineTo(16, 6 + (frame % 2));
      ctx.moveTo(12, 12);
      ctx.lineTo(16, 14 - (frame % 2));
      ctx.stroke();
    });

    this.createSpriteSheet('enemy-coconut', 12, 12, 3, (ctx, frame) => {
      ctx.fillStyle = '#5b2b0c';
      ctx.beginPath();
      ctx.arc(6, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#311804';
      ctx.beginPath();
      ctx.arc(4 + frame % 2, 4, 1.5, 0, Math.PI * 2);
      ctx.arc(8 - (frame % 2), 4.5, 1.2, 0, Math.PI * 2);
      ctx.arc(6 + ((frame + 1) % 2), 7, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private createSpriteSheet(
    key: string,
    frameWidth: number,
    frameHeight: number,
    frameCount: number,
    draw: (ctx: CanvasRenderingContext2D, frame: number) => void
  ): void {
    const texture = this.textures.createCanvas(key, frameWidth * frameCount, frameHeight);
    const ctx = texture.getContext();
    for (let i = 0; i < frameCount; i += 1) {
      ctx.save();
      ctx.translate(i * frameWidth, 0);
      draw(ctx, i);
      ctx.restore();
      texture.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
    texture.refresh();
  }

  private createParticleTexture(): void {
    const g = this.add.graphics();
    const colors = [0xffe082, 0xffb347, 0xffffff];
    colors.forEach((color, index) => {
      g.fillStyle(color, 0.9);
      g.fillCircle(6, 6, 4 - index);
    });
    g.generateTexture('enemy-spark', 12, 12);
    g.destroy();
  }

  private createSynthSounds(): void {
    const context = this.sound.context as AudioContext | null;
    if (!context) {
      return;
    }
    const createBeep = (key: string, frequency: number, duration: number): void => {
      const length = Math.floor(context.sampleRate * duration);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        const t = i / context.sampleRate;
        const envelope = Math.exp(-6 * t);
        data[i] = Math.sin(Math.PI * 2 * frequency * t) * envelope;
      }
      this.cache.audio.add(key, { buffer });
    };

    createBeep('enemy-hit', 860, 0.18);
    createBeep('time-drain', 420, 0.24);
  }
}
