import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface CondorSpawnParams extends EnemySpawnParams {
  speed: number;
  amplitude: number;
}

export default class CondorEnemy extends BaseEnemy {
  private readonly direction: number;

  private readonly baseY: number;

  private readonly speed: number;

  private readonly amplitude: number;

  constructor(scene: GameScene, params: CondorSpawnParams) {
    super(scene, 'enemy-condor', params);
    this.direction = params.direction === 'left' ? -1 : 1;
    this.baseY = params.y;
    this.speed = params.speed;
    this.amplitude = params.amplitude;
    this.setDepth(12);
    this.body.setAllowGravity(false);
    this.setVelocityX(this.direction * this.speed);
    this.setFlipX(this.direction < 0);
    this.play({ key: 'condor-fly', repeat: -1 });
    this.collisionEffect = 'knockdown';
  }

  protected updateEnemy(time: number): void {
    this.y = this.baseY + Math.sin(time / 160) * this.amplitude;
    if (this.x < -48 || this.x > this.scene.scale.width + 48) {
      this.despawn();
    }
  }
}
