import Phaser from 'phaser';
import BaseEnemy from '../objects/BaseEnemy';
import EnemySpawner, { EnemySpawnerConfig } from '../objects/EnemySpawner';
import { EnemySpawnParams } from '../objects/BaseEnemy';
import { createEnemy } from '../objects/EnemyFactory';
import Player from '../objects/Player';

interface LevelBranchConfig {
  x: number;
  y: number;
  hasFruit: boolean;
}

interface StageSettings {
  branchSpacing: number;
  fruitChance: number;
  horizontalHazardDelay: number;
  horizontalHazardSpeed: number;
  fallingHazardDelay: number;
  fallingHazardGravity: number;
  goalHeight: number;
  doubleBranchEvery: number;
  branchJitter: number;
}

export default class GameScene extends Phaser.Scene {
  private player!: Player;

  private branches!: Phaser.Physics.Arcade.StaticGroup;

  private fruits!: Phaser.Physics.Arcade.Group;

  private enemies!: Phaser.Physics.Arcade.Group;

  private projectiles!: Phaser.Physics.Arcade.Group;

  private climbZone!: Phaser.GameObjects.Zone;

  private score = 0;

  private timeLeft = 120;

  public levelHeight = 3200;

  private stageText!: Phaser.GameObjects.Text;

  private reachedGoal = false;

  private currentStage = 1;

  private sky!: Phaser.GameObjects.TileSprite;

  private scoreText!: Phaser.GameObjects.Text;

  private timeText!: Phaser.GameObjects.Text;

  private stageSettings!: StageSettings;

  private goalMarker!: Phaser.GameObjects.Image;

  private enemySpawners: EnemySpawner[] = [];

  private branchConfigs: LevelBranchConfig[] = [];

  private enemyParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager;

  private playerHitCooldown = 0;

  constructor() {
    super('game');
  }

  init(data: { stage?: number; score?: number } = {}): void {
    this.currentStage = data.stage ?? 1;
    this.score = data.score ?? 0;
    this.timeLeft = 120;
    this.reachedGoal = false;
    this.stageSettings = this.getStageSettings(this.currentStage);
    this.levelHeight = Phaser.Math.Clamp(3200 + (this.currentStage - 1) * 120, 3200, 4000);
    this.enemySpawners = [];
    this.branchConfigs = [];
    this.playerHitCooldown = 0;
  }

  create(): void {
    this.createWorld();
    this.createTree();
    this.createBranchesAndFruits();
    this.createPlayer();
    this.createEffects();
    this.createHazards();
    this.createUI();
    this.initColliders();
  }

  private createWorld(): void {
    this.physics.world.setBounds(0, 0, 256, this.levelHeight, true, true, true, false);
    this.sky = this.add.tileSprite(128, this.levelHeight / 2, 256, this.levelHeight, 'sky');
    this.sky.setOrigin(0.5, 0.5);
    this.sky.setScrollFactor(0, 0);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, 256, this.levelHeight);
    camera.setBackgroundColor('#0c1a2a');
  }

  private createTree(): void {
    const trunkCount = Math.ceil(this.levelHeight / 64) + 2;
    for (let i = 0; i < trunkCount; i += 1) {
      const trunk = this.add.image(128, this.levelHeight - i * 64, 'trunk');
      trunk.setOrigin(0.5, 1);
    }

    const goalY = this.stageSettings.goalHeight;
    this.goalMarker = this.add.image(128, goalY, 'goal-banner');
    this.goalMarker.setOrigin(0.5, 1);
    this.goalMarker.setDepth(6);

    this.climbZone = this.add.zone(128, this.levelHeight / 2, 48, this.levelHeight);
    this.physics.add.existing(this.climbZone, true);
  }

  private createBranchesAndFruits(): void {
    this.branches = this.physics.add.staticGroup();
    this.fruits = this.physics.add.group({ allowGravity: false, immovable: true });

    const configs = this.generateLevelLayout();
    this.branchConfigs = configs;
    configs.forEach((config) => {
      const branch = this.branches.create(config.x, config.y, 'branch') as Phaser.Physics.Arcade.Sprite;
      branch.setOrigin(0.5, 0.5);
      branch.refreshBody();

      if (config.hasFruit) {
        const fruit = this.fruits.create(config.x, config.y - 20, 'fruit');
        fruit.setData('value', 200);
        fruit.setData('floatingSeed', Phaser.Math.Between(0, 1000));
      }
    });
  }

  private generateLevelLayout(): LevelBranchConfig[] {
    const pickOffsetCenter = () => {
      const sign = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
      return 128 + sign * Phaser.Math.Between(20, 28);
    };

    const pickEdgeLane = () => (Phaser.Math.Between(0, 1) === 0 ? 72 : 184);

    const configs: LevelBranchConfig[] = [{ x: pickOffsetCenter(), y: this.levelHeight - 42, hasFruit: false }];
    const startY = this.levelHeight - 140;
    const endY = this.stageSettings.goalHeight + 40;
    const lanes = [72, 104, 152, 184];
    let direction = -1;
    let index = 0;

    for (let y = startY; y > endY; y -= this.stageSettings.branchSpacing) {
      const jitterY = Phaser.Math.Between(-this.stageSettings.branchJitter, this.stageSettings.branchJitter);
      const nearGoal = y < this.stageSettings.goalHeight + 140;
      let branchX = direction === -1 ? lanes[0 + Phaser.Math.Between(0, 1)] : lanes[3 - Phaser.Math.Between(0, 1)];

      if (nearGoal) {
        branchX = pickEdgeLane();
      } else if (index % this.stageSettings.doubleBranchEvery === 0) {
        branchX = pickOffsetCenter();
      }

      configs.push({
        x: branchX,
        y: y + jitterY,
        hasFruit: Phaser.Math.FloatBetween(0, 1) < this.stageSettings.fruitChance
      });

      if (!nearGoal && index % this.stageSettings.doubleBranchEvery === 1) {
        const offsetY = Phaser.Math.Between(14, 26);
        const altY = y + jitterY - offsetY;
        if (altY > endY) {
          const oppositeLane = direction === -1 ? lanes[3] : lanes[0];
          configs.push({
            x: oppositeLane,
            y: altY,
            hasFruit: Phaser.Math.FloatBetween(0, 1) < this.stageSettings.fruitChance * 0.6
          });
        }
      }

      direction *= -1;
      index += 1;
    }

    configs.push({ x: pickEdgeLane(), y: this.stageSettings.goalHeight + 28, hasFruit: false });

    return configs;
  }

  private createPlayer(): void {
    const startX = 128;
    const startY = this.levelHeight - 140;
    this.player = new Player(this, startX, startY);
    this.player.setClimbZone(this.climbZone);

    this.player.setDepth(10);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.15, 0, 20);
    this.cameras.main.setScroll(0, this.levelHeight - this.scale.height);
  }

  private createEffects(): void {
    this.enemyParticles = this.add.particles(0, 0, 'enemy-spark', {
      lifespan: { min: 220, max: 360 },
      speed: { min: 60, max: 120 },
      gravityY: 140,
      scale: { start: 0.9, end: 0 },
      quantity: 12,
      emitting: false
    });
    this.enemyParticles.setDepth(18);
  }

  private createHazards(): void {
    this.createEnemyAnimations();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemySpawners.forEach((spawner) => spawner.destroy());
    this.enemySpawners = this.getSpawnerConfigsForStage(this.currentStage).map(
      (config) => new EnemySpawner(this, config)
    );
  }

  private createEnemyAnimations(): void {
    const anims = this.anims;
    if (!anims.exists('condor-fly')) {
      anims.create({
        key: 'condor-fly',
        frames: anims.generateFrameNames('enemy-condor', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!anims.exists('scorpion-walk')) {
      anims.create({
        key: 'scorpion-walk',
        frames: anims.generateFrameNames('enemy-scorpion', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!anims.exists('monkey-climb')) {
      anims.create({
        key: 'monkey-climb',
        frames: anims.generateFrameNames('enemy-monkey', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!anims.exists('monkey-throw')) {
      anims.create({
        key: 'monkey-throw',
        frames: anims.generateFrameNames('enemy-monkey', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: 0
      });
    }
    if (!anims.exists('snake-rise')) {
      anims.create({
        key: 'snake-rise',
        frames: anims.generateFrameNames('enemy-snake', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!anims.exists('spider-sway')) {
      anims.create({
        key: 'spider-sway',
        frames: anims.generateFrameNames('enemy-spider', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!anims.exists('coconut-spin')) {
      anims.create({
        key: 'coconut-spin',
        frames: anims.generateFrameNames('enemy-coconut', { start: 0, end: 2 }),
        frameRate: 12,
        repeat: -1
      });
    }
  }

  private getSpawnerConfigsForStage(stage: number): EnemySpawnerConfig[] {
    const configs: EnemySpawnerConfig[] = [];
    const condorSpeed = 70 + stage * 8;
    const condorInterval = Phaser.Math.Clamp(3600 - stage * 160, 2200, 3600);
    configs.push({
      type: 'condor',
      interval: condorInterval,
      initialDelay: 1200,
      maxAlive: 2 + Math.floor(stage / 4),
      resolveSpawn: () => {
        const direction = Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right';
        const spawnX = direction === 'left' ? -28 : this.scale.width + 28;
        const baseY = Phaser.Math.Clamp(
          this.player.y - Phaser.Math.Between(-40, 160),
          this.stageSettings.goalHeight + 60,
          this.levelHeight - 220
        );
        return {
          x: spawnX,
          y: baseY,
          direction,
          speed: condorSpeed,
          amplitude: Phaser.Math.Between(10, 24)
        } as EnemySpawnParams;
      }
    });

    const scorpionInterval = Phaser.Math.Clamp(5200 - stage * 180, 3000, 5200);
    configs.push({
      type: 'scorpion',
      interval: scorpionInterval,
      initialDelay: 2200,
      maxAlive: 2 + Math.floor(stage / 3),
      resolveSpawn: () => {
        const branch = this.pickBranchNear(this.player.y, 160);
        if (!branch) {
          return null;
        }
        const span = 28;
        const minX = branch.x - span;
        const maxX = branch.x + span;
        const direction = Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right';
        return {
          x: Phaser.Math.Clamp(branch.x + Phaser.Math.Between(-16, 16), minX + 2, maxX - 2),
          y: branch.y - 4,
          direction,
          branchLimits: { minX, maxX },
          speed: Phaser.Math.Between(28, 36) + stage * 2
        } as EnemySpawnParams;
      }
    });

    if (stage >= 2) {
      const monkeyInterval = Phaser.Math.Clamp(6400 - stage * 220, 3400, 6400);
      configs.push({
        type: 'monkey',
        interval: monkeyInterval,
        initialDelay: 2600,
        maxAlive: 2,
        resolveSpawn: () => {
          const cameraBottom = this.cameras.main.scrollY + this.scale.height - 40;
          const top = Phaser.Math.Clamp(
            this.player.y - Phaser.Math.Between(90, 140),
            this.stageSettings.goalHeight + 48,
            cameraBottom - 120
          );
          const bottom = Phaser.Math.Clamp(top + Phaser.Math.Between(90, 150), top + 40, cameraBottom);
          const orientation = Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right';
          return {
            x: 128 + Phaser.Math.Between(-18, 18),
            y: bottom,
            direction: orientation,
            verticalDirection: 'up',
            travelBounds: { top, bottom },
            throwInterval: Phaser.Math.Between(1800, 2600)
          } as EnemySpawnParams;
        }
      });
    }

    if (stage >= 3) {
      const snakeInterval = Phaser.Math.Clamp(7200 - stage * 200, 3600, 7200);
      configs.push({
        type: 'snake',
        interval: snakeInterval,
        initialDelay: 3000,
        maxAlive: 2,
        resolveSpawn: () => {
          const branch = this.pickBranchNear(this.player.y + 40, 200);
          if (!branch) {
            return null;
          }
          const baseY = branch.y + 14;
          const holeX = Phaser.Math.Between(0, 1) === 0 ? 112 : 144;
          return {
            x: holeX,
            y: baseY,
            baseY,
            emergeHeight: Phaser.Math.Between(14, 22),
            speed: 32 + stage * 3,
            direction: Phaser.Math.Between(0, 1) === 0 ? 'left' : 'right'
          } as EnemySpawnParams;
        }
      });
    }

    if (stage >= 4) {
      const spiderInterval = Phaser.Math.Clamp(8400 - stage * 240, 4000, 8400);
      configs.push({
        type: 'spider',
        interval: spiderInterval,
        initialDelay: 3600,
        maxAlive: 1 + Math.floor(stage / 5),
        resolveSpawn: () => {
          const branch = this.pickBranchNear(this.player.y - 40, 180);
          if (!branch) {
            return null;
          }
          const dropY = Phaser.Math.Clamp(branch.y - Phaser.Math.Between(40, 90), this.stageSettings.goalHeight, branch.y - 24);
          return {
            x: branch.x,
            y: dropY,
            dropHeight: branch.y - dropY - 8
          } as EnemySpawnParams;
        }
      });
    }

    return configs;
  }

  private pickBranchNear(y: number, tolerance: number): LevelBranchConfig | undefined {
    const valid = this.branchConfigs.filter(
      (branch) => Math.abs(branch.y - y) < tolerance && branch.y > this.stageSettings.goalHeight + 20
    );
    if (valid.length === 0) {
      return undefined;
    }
    return Phaser.Utils.Array.GetRandom(valid);
  }

  public registerEnemy(enemy: BaseEnemy): void {
    if (enemy.isProjectile()) {
      this.projectiles.add(enemy);
    } else {
      this.enemies.add(enemy);
    }
  }

  public spawnProjectile(config: { x: number; y: number; speed: number; direction: number }): void {
    const params: EnemySpawnParams = {
      x: config.x,
      y: config.y,
      speed: config.speed,
      direction: config.direction < 0 ? 'left' : 'right'
    };
    const projectile = createEnemy(this, 'coconut', params);
    this.registerEnemy(projectile);
  }

  public hasReachedGoal(): boolean {
    return this.reachedGoal;
  }

  private createUI(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '10px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#ffe082',
      stroke: '#401000',
      strokeThickness: 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000',
        fill: true
      }
    };

    const stageLabel = this.currentStage.toString().padStart(2, '0');
    this.scoreText = this.add.text(8, 8, '', style).setOrigin(0, 0).setScrollFactor(0);
    this.timeText = this.add.text(this.scale.width - 8, 8, '', style).setOrigin(1, 0).setScrollFactor(0);
    this.stageText = this.add
      .text(this.scale.width / 2, this.scale.height - 10, `FASE ${stageLabel} - SUBA AO TOPO!`, style)
      .setOrigin(0.5, 1)
      .setScrollFactor(0);
    this.stageText.setStyle({ color: '#ffe082' });

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.reachedGoal) {
          return;
        }
        this.timeLeft -= 1;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.handleGameOver('TEMPO ESGOTOU');
        }
        this.updateHUD();
      }
    });

    this.updateHUD();
  }

  private initColliders(): void {
    this.physics.add.collider(this.player, this.branches);
    this.physics.add.collider(this.enemies, this.branches);
    this.physics.add.overlap(this.player, this.fruits, this.collectFruit, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyCollision, undefined, this);
    this.physics.add.overlap(this.player, this.projectiles, this.handleProjectileCollision, undefined, this);
    this.physics.add.collider(this.projectiles, this.branches, this.handleProjectileBlock, undefined, this);
  }

  private collectFruit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, fruit) => {
    const sprite = fruit as Phaser.Physics.Arcade.Sprite;
    if (!sprite.active) {
      return;
    }
    sprite.disableBody(true, true);
    const value = sprite.getData('value') ?? 100;
    this.addFloatingText(sprite.x, sprite.y, `+${value}`);
    this.score += value;
    this.adjustTime(2);
    this.addFloatingText(sprite.x, sprite.y - 16, '+2 TEMPO');
  };

  private handleEnemyCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, enemy) => {
    const foe = enemy as BaseEnemy;
    if (!foe.active || this.playerHitCooldown > 0 || this.reachedGoal) {
      return;
    }
    this.playerHitCooldown = 700;
    this.enemyParticles.emitParticleAt(foe.x, foe.y, 12);
    const effect = foe.getCollisionEffect();
    if (effect === 'knockdown') {
      const impulse = foe.x < this.player.x ? 120 : -120;
      this.player.detachFromClimb(impulse, -220);
      this.adjustTime(-6);
      this.sound.play('enemy-hit');
    } else if (effect === 'fatal') {
      this.sound.play('enemy-hit');
      this.handleGameOver('CAPTURADO!');
    }
    foe.despawn();
  };

  private handleProjectileCollision: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, projectile) => {
    const hazard = projectile as BaseEnemy;
    if (!hazard.active || this.reachedGoal) {
      return;
    }
    hazard.despawn();
    this.enemyParticles.emitParticleAt(hazard.x, hazard.y, 10);
    this.sound.play('time-drain');
    this.adjustTime(-4);
  };

  private handleProjectileBlock: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_object, projectile) => {
    const hazard = projectile as BaseEnemy;
    if (!hazard.active) {
      return;
    }
    this.enemyParticles.emitParticleAt(hazard.x, hazard.y, 8);
    hazard.despawn();
  };

  private adjustTime(delta: number): void {
    this.timeLeft = Phaser.Math.Clamp(this.timeLeft + delta, 0, 180);
    this.updateHUD();
    if (this.timeLeft <= 0 && !this.reachedGoal) {
      this.handleGameOver('TEMPO ESGOTOU');
    }
  }

  update(_time: number, delta: number): void {
    if (this.reachedGoal) {
      return;
    }

    if (this.playerHitCooldown > 0) {
      this.playerHitCooldown = Math.max(0, this.playerHitCooldown - delta);
    }

    this.animateFruits();
    this.updateBackgroundParallax();
    this.checkGoal();
    this.checkFall();
  }

  private updateBackgroundParallax(): void {
    const scrollY = this.cameras.main.scrollY;
    this.sky.tilePositionY = scrollY * 0.2;
  }

  private animateFruits(): void {
    const time = this.time.now;
    this.fruits.children.each((child) => {
      const fruit = child as Phaser.Physics.Arcade.Sprite;
      if (!fruit.active) {
        return true;
      }
      const seed = fruit.getData('floatingSeed') as number;
      fruit.y += Math.sin((time + seed) / 350) * 0.3;
      return true;
    });
  }

  private checkGoal(): void {
    if (this.player.y < this.stageSettings.goalHeight && !this.reachedGoal) {
      this.reachedGoal = true;
      this.score += Math.max(this.timeLeft * 50, 0);
      this.addFloatingText(this.player.x, this.player.y - 40, 'VITÓRIA!');
      this.updateHUD();
      this.time.delayedCall(1200, () => {
        this.scene.restart({ stage: this.currentStage + 1, score: this.score });
      });
      const currentLabel = this.currentStage.toString().padStart(2, '0');
      const nextLabel = (this.currentStage + 1).toString().padStart(2, '0');
      this.stageText.setText(`FASE ${currentLabel} COMPLETA! PROXIMA ${nextLabel}`);
      this.stageText.setStyle({ color: '#aef78d' });
    }
  }

  private checkFall(): void {
    if (this.player.y > this.levelHeight - 40 && !this.reachedGoal) {
      this.handleGameOver('CAIU!');
    }
  }

  private handleGameOver(reason: string): void {
    if (this.reachedGoal) {
      return;
    }
    this.reachedGoal = true;
    this.time.addEvent({ delay: 1200, callback: () => this.scene.restart({ stage: 1 }) });
    this.stageText.setText(`FIM DE JOGO: ${reason}`);
    this.stageText.setStyle({ color: '#ff4f4f' });
    this.addFloatingText(this.player.x, this.player.y - 30, reason);
  }

  private addFloatingText(x: number, y: number, text: string): void {
    const floating = this.add.text(x, y, text, {
      fontSize: '10px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 2
    });
    floating.setOrigin(0.5);
    this.tweens.add({
      targets: floating,
      y: y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Sine.easeOut',
      onComplete: () => floating.destroy()
    });
  }

  private updateHUD(): void {
    const paddedScore = this.score.toString().padStart(7, '0');
    const paddedTime = this.timeLeft.toString().padStart(3, '0');
    this.scoreText.setText(`PONTOS\n${paddedScore}`);
    this.timeText.setText(`TEMPO\n${paddedTime}`);
  }

  private getStageSettings(stage: number): StageSettings {
    const clamped = Phaser.Math.Clamp(stage, 1, 10);
    const branchSpacing = Phaser.Math.Clamp(140 - (clamped - 1) * 8, 90, 150);
    const fruitChance = Phaser.Math.Clamp(0.7 - (clamped - 1) * 0.05, 0.4, 0.75);
    const horizontalHazardDelay = Phaser.Math.Clamp(2800 - (clamped - 1) * 180, 1500, 2800);
    const horizontalHazardSpeed = 85 + (clamped - 1) * 14;
    const fallingHazardDelay = Phaser.Math.Clamp(5200 - (clamped - 1) * 220, 2800, 5200);
    const fallingHazardGravity = 360 + (clamped - 1) * 28;
    const goalHeight = 200;
    const doubleBranchEvery = Math.max(5 - Math.floor(clamped / 2), 2);
    const branchJitter = clamped > 4 ? 16 : 12;
    return {
      branchSpacing,
      fruitChance,
      horizontalHazardDelay,
      horizontalHazardSpeed,
      fallingHazardDelay,
      fallingHazardGravity,
      goalHeight,
      doubleBranchEvery,
      branchJitter
    };
  }
}
