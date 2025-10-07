import Phaser from 'phaser';
import GameScene from '../scenes/GameScene';
import BaseEnemy, { EnemySpawnParams } from './BaseEnemy';
import { EnemyType, createEnemy } from './EnemyFactory';

export interface EnemySpawnerConfig {
  type: EnemyType;
  interval: number;
  initialDelay?: number;
  maxAlive: number;
  resolveSpawn: () => EnemySpawnParams | null;
}

export default class EnemySpawner {
  private readonly scene: GameScene;

  private readonly config: EnemySpawnerConfig;

  private readonly active = new Set<BaseEnemy>();

  private timer?: Phaser.Time.TimerEvent;

  constructor(scene: GameScene, config: EnemySpawnerConfig) {
    this.scene = scene;
    this.config = config;
    this.start();
  }

  private start(): void {
    this.timer = this.scene.time.addEvent({
      delay: this.config.interval,
      loop: true,
      startAt: this.config.initialDelay ?? this.config.interval,
      callback: () => this.trySpawn()
    });
  }

  private trySpawn(): void {
    if (this.scene.hasReachedGoal()) {
      return;
    }
    if (this.active.size >= this.config.maxAlive) {
      return;
    }
    const params = this.config.resolveSpawn();
    if (!params) {
      return;
    }

    const enemy = createEnemy(this.scene, this.config.type, params);
    this.scene.registerEnemy(enemy);
    this.active.add(enemy);
    enemy.once('despawn', () => {
      this.active.delete(enemy);
    });
  }

  destroy(): void {
    this.timer?.remove(false);
    this.active.clear();
  }
}
