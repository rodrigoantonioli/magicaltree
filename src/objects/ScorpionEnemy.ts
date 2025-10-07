import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface ScorpionSpawnParams extends EnemySpawnParams {
  branchLimits: { minX: number; maxX: number };
  speed: number;
}

export default class ScorpionEnemy extends BaseEnemy {
  private direction = 1;

  private readonly minX: number;

  private readonly maxX: number;

  private readonly speed: number;

  constructor(scene: GameScene, params: ScorpionSpawnParams) {
    super(scene, 'enemy-scorpion', params);
    this.body.setAllowGravity(false);
    this.body.setImmovable(false);
    this.body.setVelocityX(0);
    this.minX = params.branchLimits.minX;
    this.maxX = params.branchLimits.maxX;
    this.speed = params.speed;
    this.direction = params.direction === 'left' ? -1 : 1;
    this.setFlipX(this.direction < 0);
    this.setDepth(11);
    this.play({ key: 'scorpion-walk', repeat: -1 });
  }

  protected updateEnemy(): void {
    this.body.setVelocityX(this.direction * this.speed);
    if (this.x <= this.minX) {
      this.direction = 1;
      this.setFlipX(false);
      this.x = this.minX + 1;
    } else if (this.x >= this.maxX) {
      this.direction = -1;
      this.setFlipX(true);
      this.x = this.maxX - 1;
    }

    if (this.y > this.host.levelHeight - 40) {
      this.despawn();
    }
  }
}
