import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.createProceduralTextures();
  }

  create(): void {
    this.scene.start('game');
  }

  private createProceduralTextures(): void {
    this.createPlayerTexture();
    this.createPlayerAnimations();
    this.createTrunkTexture();
    this.createBranchTexture();
    this.createFruitTexture();
    this.createHazardTexture();
    this.createCoconutTexture();
    this.createGoalBannerTexture();
    this.createWarningTextures();
    this.createBackgroundTexture();
  }

  private createPlayerTexture(): void {
    const buildFrame = (key: string, options: {
      legOffset?: number;
      armSwing?: number;
      bodyTint?: number;
      crouched?: boolean;
    }): void => {
      const g = this.add.graphics();
      const skin = 0xf2d5a3;
      const hair = 0x482f1b;
      const tunic = 0xd12f2f;
      const legs = 0x1f7f1f;
      const shoes = 0x472b13;
      const armSwing = options.armSwing ?? 0;
      const legOffset = options.legOffset ?? 0;
      const bodyTint = options.bodyTint ?? tunic;
      const crouched = options.crouched ?? false;

      const bodyHeight = crouched ? 6 : 8;
      const bodyY = crouched ? 8 : 6;

      g.fillStyle(skin);
      g.fillRect(2, 0, 12, 6);
      g.fillStyle(hair);
      g.fillRect(2, 0, 12, 2);

      g.fillStyle(bodyTint);
      g.fillRect(0, bodyY, 16, bodyHeight);

      g.fillStyle(legs);
      g.fillRect(2 + legOffset, 14, 5, crouched ? 6 : 10);
      g.fillRect(9 - legOffset, 14, 5, crouched ? 6 : 10);

      g.fillStyle(shoes);
      g.fillRect(2 + legOffset, 24 - (crouched ? 4 : 0), 5, 3);
      g.fillRect(9 - legOffset, 24 - (crouched ? 4 : 0), 5, 3);

      g.fillStyle(skin);
      g.fillRect(armSwing <= 0 ? 0 : 1, 10 + armSwing, 4, 6);
      g.fillRect(armSwing >= 0 ? 12 : 11, 10 - armSwing, 4, 6);

      g.generateTexture(key, 16, 28);
      g.destroy();
    };

    buildFrame('player-idle', { armSwing: 0, legOffset: 0 });
    buildFrame('player-run-a', { armSwing: 1, legOffset: 1 });
    buildFrame('player-run-b', { armSwing: -1, legOffset: -1 });
    buildFrame('player-jump', { armSwing: -2, legOffset: 2, bodyTint: 0xc92a2a });
    buildFrame('player-fall', { armSwing: 2, legOffset: -2, bodyTint: 0xc92a2a });
    buildFrame('player-climb-a', { armSwing: -1, legOffset: 0, bodyTint: 0xce2c2c });
    buildFrame('player-climb-b', { armSwing: 1, legOffset: 0, bodyTint: 0xce2c2c });
    buildFrame('player-slide', { armSwing: 0, legOffset: 0, bodyTint: 0xb91f1f, crouched: true });
    buildFrame('player-hang', { armSwing: -2, legOffset: 0, bodyTint: 0xd84b4b });
    buildFrame('player-hit', { armSwing: 2, legOffset: 0, bodyTint: 0xff6b6b });
  }

  private createPlayerAnimations(): void {
    const create = (
      key: string,
      frames: string[],
      frameRate: number,
      repeat: number = -1
    ): void => {
      this.anims.create({
        key,
        frames: frames.map((frameKey) => ({ key: frameKey })),
        frameRate,
        repeat
      });
    };

    create('player-run', ['player-run-a', 'player-run-b'], 8);
    create('player-climb', ['player-climb-a', 'player-climb-b'], 6);
    create('player-idle', ['player-idle'], 1, -1);
    create('player-jump', ['player-jump'], 1, -1);
    create('player-fall', ['player-fall'], 1, -1);
    create('player-slide', ['player-slide'], 1, -1);
    create('player-hang', ['player-hang'], 1, -1);
    create('player-hit', ['player-hit'], 1, -1);
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

  private createHazardTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x3f7fff);
    g.fillCircle(10, 10, 10);
    g.fillStyle(0x001a40);
    g.fillCircle(6, 8, 4);
    g.fillCircle(14, 8, 4);
    g.fillStyle(0xffffff);
    g.fillCircle(6, 8, 2);
    g.fillCircle(14, 8, 2);
    g.generateTexture('hazard', 20, 20);
    g.destroy();
  }

  private createCoconutTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x5b2b0c);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0x311804, 0.9);
    g.fillCircle(4, 4, 1.5);
    g.fillCircle(8, 3.5, 1.2);
    g.fillCircle(6.5, 7.5, 1.1);
    g.generateTexture('coconut', 12, 12);
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

  private createWarningTextures(): void {
    const createTriangle = (key: string, points: [number, number][]): void => {
      const g = this.add.graphics();
      g.fillStyle(0xff5252);
      g.fillTriangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1]);
      g.lineStyle(1, 0xffffff, 0.8);
      g.strokeTriangle(points[0][0], points[0][1], points[1][0], points[1][1], points[2][0], points[2][1]);
      g.generateTexture(key, 12, 12);
      g.destroy();
    };

    createTriangle('warning-left', [ [0, 6], [10, 0], [10, 12] ]);
    createTriangle('warning-right', [ [12, 6], [2, 0], [2, 12] ]);
    createTriangle('warning-down', [ [6, 12], [0, 2], [12, 2] ]);
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
}
