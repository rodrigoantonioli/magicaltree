import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface CoconutSpawnParams extends EnemySpawnParams {
  speed: number;
}

export default class CoconutProjectile extends BaseEnemy {
  private readonly speed: number;

  private readonly horizontalDirection: number;

  constructor(scene: GameScene, params: CoconutSpawnParams) {
    super(scene, 'enemy-coconut', params, true);
    this.body.setAllowGravity(true);
    this.body.setCircle(5, 1, 1);
    this.speed = params.speed;
    this.horizontalDirection = params.direction === 'left' ? -1 : 1;
    this.collisionEffect = 'time-drain';
    this.setDepth(8);
    this.play({ key: 'coconut-spin', repeat: -1 });
    this.body.setVelocityX(this.horizontalDirection * this.speed);
  }

  protected updateEnemy(): void {
    if (this.y > this.host.levelHeight - 12) {
      this.despawn();
    }
  }
}
