import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';

export type EnemyCollisionEffect = 'knockdown' | 'time-drain' | 'fatal';

export interface EnemySpawnParams {
  x: number;
  y: number;
  direction?: 'left' | 'right';
  verticalDirection?: 'up' | 'down';
  speed?: number;
  branchLimits?: { minX: number; maxX: number };
  travelBounds?: { top: number; bottom: number };
  amplitude?: number;
  dropHeight?: number;
  baseY?: number;
  spawnDelay?: number;
  targetX?: number;
  throwInterval?: number;
}

export default abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  protected host: GameScene;

  protected collisionEffect: EnemyCollisionEffect = 'knockdown';

  protected readonly spawnData: EnemySpawnParams;

  private readonly isProjectileFlag: boolean;

  private despawned = false;

  constructor(scene: GameScene, texture: string, params: EnemySpawnParams, projectile = false) {
    super(scene, params.x, params.y, texture, 0);
    this.host = scene;
    this.spawnData = params;
    this.isProjectileFlag = projectile;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(9);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) {
      return;
    }
    this.updateEnemy(time, delta);
  }

  protected abstract updateEnemy(time: number, delta: number): void;

  public getCollisionEffect(): EnemyCollisionEffect {
    return this.collisionEffect;
  }

  public isProjectile(): boolean {
    return this.isProjectileFlag;
  }

  public despawn(): void {
    if (this.despawned) {
      return;
    }
    this.despawned = true;
    this.disableBody(true, true);
    this.emit('despawn', this);
    this.scene.time.delayedCall(0, () => this.destroy());
  }
}
