import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';

export interface SpiderSpawnParams extends EnemySpawnParams {
  dropHeight: number;
}

export default class VineSpiderEnemy extends BaseEnemy {
  private readonly baseY: number;

  private readonly dropHeight: number;

  private dropping = true;

  constructor(scene: GameScene, params: SpiderSpawnParams) {
    super(scene, 'enemy-spider', params);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.baseY = params.y;
    this.dropHeight = params.dropHeight;
    this.setDepth(14);
    this.play({ key: 'spider-sway', repeat: -1 });
    this.scene.tweens.add({
      targets: this,
      y: this.baseY + this.dropHeight,
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        this.dropping = tween.progress < 0.5;
      }
    });
  }

  protected updateEnemy(time: number, delta: number): void {
    this.rotation = Math.sin(time / 320) * 0.12;
    if (!this.dropping && this.y <= this.baseY + 2) {
      this.despawn();
    }
  }
}
