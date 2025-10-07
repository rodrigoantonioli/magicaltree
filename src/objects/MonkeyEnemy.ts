import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface MonkeySpawnParams extends EnemySpawnParams {
  travelBounds: { top: number; bottom: number };
  throwInterval: number;
}

export default class MonkeyEnemy extends BaseEnemy {
  private readonly top: number;

  private readonly bottom: number;

  private direction = -1;

  private readonly throwInterval: number;

  private lastThrow = 0;

  constructor(scene: GameScene, params: MonkeySpawnParams) {
    super(scene, 'enemy-monkey', params);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.top = params.travelBounds.top;
    this.bottom = params.travelBounds.bottom;
    this.throwInterval = params.throwInterval;
    this.direction = params.verticalDirection === 'down' ? 1 : -1;
    if (params.direction) {
      this.setFlipX(params.direction === 'left');
    }
    this.setDepth(13);
    this.play({ key: 'monkey-climb', repeat: -1 });
  }

  protected updateEnemy(time: number, delta: number): void {
    const speed = 40;
    this.body.setVelocityY(this.direction * speed);
    if (this.y <= this.top) {
      this.direction = 1;
      this.y = this.top + 2;
    } else if (this.y >= this.bottom) {
      this.direction = -1;
      this.y = this.bottom - 2;
    }

    if (time > this.lastThrow + this.throwInterval) {
      this.throwProjectile();
      this.lastThrow = time;
    }
  }

  private throwProjectile(): void {
    const offsetX = this.flipX ? -6 : 6;
    const spawnX = this.x + offsetX;
    const spawnY = this.y - 4;
    this.host.spawnProjectile({
      x: spawnX,
      y: spawnY,
      speed: Phaser.Math.Between(60, 90),
      direction: this.flipX ? -1 : 1
    });
    this.anims.play({ key: 'monkey-throw', repeat: 0 }, true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.play({ key: 'monkey-climb', repeat: -1 });
    });
  }
}
