import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface SnakeSpawnParams extends EnemySpawnParams {
  baseY: number;
  emergeHeight: number;
  speed: number;
}

export default class SnakeEnemy extends BaseEnemy {
  private readonly emergeHeight: number;

  private readonly baseY: number;

  private readonly speed: number;

  private direction = 1;

  constructor(scene: GameScene, params: SnakeSpawnParams) {
    super(scene, 'enemy-snake', params);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setVelocityX(0);
    this.baseY = params.baseY;
    this.emergeHeight = params.emergeHeight;
    this.speed = params.speed;
    this.direction = params.direction === 'left' ? -1 : 1;
    this.collisionEffect = 'knockdown';
    this.setDepth(10);
    this.play({ key: 'snake-rise', repeat: -1 });
    this.setY(this.baseY);
    this.scene.tweens.add({
      targets: this,
      y: this.baseY - this.emergeHeight,
      duration: 260,
      ease: 'Sine.easeOut'
    });
  }

  protected updateEnemy(): void {
    this.body.setVelocityX(this.direction * this.speed);
    if (this.x < this.spawnData.x - 24) {
      this.direction = 1;
      this.setFlipX(false);
    } else if (this.x > this.spawnData.x + 24) {
      this.direction = -1;
      this.setFlipX(true);
    }
  }
}
