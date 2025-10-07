import Phaser from 'phaser';
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

  private hazards!: Phaser.Physics.Arcade.Group;

  private climbZone!: Phaser.GameObjects.Zone;

  private score = 0;

  private timeLeft = 120;

  private levelHeight = 3200;

  private stageText!: Phaser.GameObjects.Text;

  private reachedGoal = false;

  private currentStage = 1;

  private backdrop!: Phaser.GameObjects.TileSprite;

  private scoreText!: Phaser.GameObjects.Text;

  private timeText!: Phaser.GameObjects.Text;

  private stageSettings!: StageSettings;

  private goalMarker!: Phaser.GameObjects.Image;

  private readonly hazardTelegraphDuration = 360;

  private themeMusic?: Phaser.Sound.BaseSound;

  private timerCue?: Phaser.Sound.BaseSound;

  private victoryJingle?: Phaser.Sound.BaseSound;

  private gameOverJingle?: Phaser.Sound.BaseSound;

  private timerCuePlaying = false;

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
  }

  create(): void {
    this.createWorld();
    this.createTree();
    this.createBranchesAndFruits();
    this.createPlayer();
    this.createHazards();
    this.createUI();
    this.setupAudio();
    this.initColliders();
  }

  private createWorld(): void {
    this.physics.world.setBounds(0, 0, 256, this.levelHeight, true, true, true, false);
    this.backdrop = this.add.tileSprite(128, this.levelHeight / 2, 256, this.levelHeight, 'forest-background');
    this.backdrop.setOrigin(0.5, 0.5);
    this.backdrop.setScrollFactor(0, 0);
    this.backdrop.setDepth(-10);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, 256, this.levelHeight);
    camera.setBackgroundColor('#081220');
  }

  private createTree(): void {
    const trunkCount = Math.ceil(this.levelHeight / 48) + 2;
    for (let i = 0; i < trunkCount; i += 1) {
      const trunk = this.add.image(128, this.levelHeight - i * 48, 'trunk-segment');
      trunk.setOrigin(0.5, 1);
      trunk.setDepth(2);
    }

    const goalY = this.stageSettings.goalHeight;
    this.goalMarker = this.add.image(128, goalY, 'goal-banner-msx');
    this.goalMarker.setOrigin(0.5, 1);
    this.goalMarker.setDepth(6);

    const canopyDecor = this.add.image(128, goalY + 32, 'branch-platform');
    canopyDecor.setOrigin(0.5, 0.5);
    canopyDecor.setScale(1.15, 1.1);
    canopyDecor.setDepth(5);

    this.climbZone = this.add.zone(128, this.levelHeight / 2, 48, this.levelHeight);
    this.physics.add.existing(this.climbZone, true);
  }

  private createBranchesAndFruits(): void {
    this.branches = this.physics.add.staticGroup();
    this.fruits = this.physics.add.group({ allowGravity: false, immovable: true });

    const configs = this.generateLevelLayout();
    configs.forEach((config) => {
      const branch = this.branches.create(config.x, config.y, 'branch-platform') as Phaser.Physics.Arcade.Sprite;
      branch.setOrigin(0.5, 0.5);
      branch.refreshBody();

      if (config.hasFruit) {
        const fruit = this.fruits.create(config.x, config.y - 20, 'magical-fruit');
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

  private createHazards(): void {
    this.hazards = this.physics.add.group();

    this.time.addEvent({
      delay: this.stageSettings.horizontalHazardDelay,
      loop: true,
      callback: () => this.spawnHorizontalHazard()
    });

    this.time.addEvent({
      delay: this.stageSettings.fallingHazardDelay,
      loop: true,
      callback: () => this.spawnFallingHazard()
    });
  }

  private spawnHorizontalHazard(): void {
    if (this.reachedGoal) {
      return;
    }
    const viewport = this.cameras.main;
    const minY = this.stageSettings.goalHeight + 60;
    const maxY = Math.max(viewport.scrollY + this.scale.height, minY + 40);
    const targetY = Phaser.Math.Clamp(
      this.player.y - Phaser.Math.Between(100, 220),
      minY,
      Math.min(maxY, this.levelHeight - 200)
    );
    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const spawnX = fromLeft ? -32 : this.scale.width + 32;
    const hazard = this.hazards.create(spawnX, targetY, 'condor-enemy') as Phaser.Physics.Arcade.Sprite;
    hazard.setActive(true).setVisible(true);
    hazard.setCircle(8, 2, 4);
    hazard.setDepth(8);
    hazard.setCollideWorldBounds(false);
    hazard.setVelocity(0, 0);
    hazard.setAlpha(0.3);
    hazard.play('condor-fly');
    const warning = this.add.image(
      fromLeft ? 8 : this.scale.width - 8,
      targetY,
      fromLeft ? 'warning-arrow-right' : 'warning-arrow-left'
    );
    warning.setOrigin(fromLeft ? 0 : 1, 0.5);
    warning.setDepth(18);
    warning.setAlpha(0.95);
    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: this.hazardTelegraphDuration,
      ease: 'Linear',
      onComplete: () => warning.destroy()
    });
    this.time.delayedCall(this.hazardTelegraphDuration, () => {
      if (!hazard.active) {
        return;
      }
      hazard.setAlpha(1);
      hazard.setVelocityX((fromLeft ? 1 : -1) * this.stageSettings.horizontalHazardSpeed);
      hazard.setVelocityY(Phaser.Math.Between(-16, 16));
    });
    hazard.setData('fromLeft', fromLeft);
    hazard.setData('type', 'horizontal');
  }

  private spawnFallingHazard(): void {
    if (this.reachedGoal) {
      return;
    }
    const camera = this.cameras.main;
    const spawnY = Math.max(camera.scrollY - 40, this.stageSettings.goalHeight - 120);
    const spawnX = Phaser.Math.Between(70, this.scale.width - 70);
    const hazard = this.hazards.create(spawnX, spawnY, 'coconut-danger') as Phaser.Physics.Arcade.Sprite;
    hazard.setActive(true).setVisible(true);
    hazard.setCircle(6);
    hazard.setVelocity(0, 0);
    hazard.setGravityY(0);
    hazard.setAlpha(0.2);
    const warning = this.add.image(spawnX, camera.scrollY + 24, 'warning-arrow-down');
    warning.setOrigin(0.5, 0);
    warning.setDepth(18);
    warning.setAlpha(0.95);
    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: this.hazardTelegraphDuration,
      ease: 'Linear',
      onComplete: () => warning.destroy()
    });
    this.time.delayedCall(this.hazardTelegraphDuration, () => {
      if (!hazard.active) {
        return;
      }
      hazard.setAlpha(1);
      hazard.setGravityY(this.stageSettings.fallingHazardGravity);
    });
    hazard.setData('type', 'vertical');
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
        this.updateTimerCueState();
      }
    });

    this.updateHUD();
    this.updateTimerCueState();
  }

  private initColliders(): void {
    this.physics.add.collider(this.player, this.branches);
    this.physics.add.overlap(this.player, this.fruits, this.collectFruit, undefined, this);
    this.physics.add.overlap(this.player, this.hazards, this.hitHazard, undefined, this);
  }

  private collectFruit: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, fruit) => {
    const sprite = fruit as Phaser.Physics.Arcade.Sprite;
    if (!sprite.active) {
      return;
    }
    sprite.disableBody(true, true);
    const value = sprite.getData('value') ?? 100;
    this.player.playCollectSound();
    this.addFloatingText(sprite.x, sprite.y, `+${value}`);
    this.score += value;
    this.timeLeft = Math.min(this.timeLeft + 2, 180);
    this.addFloatingText(sprite.x, sprite.y - 16, '+2 TEMPO');
    this.updateHUD();
    this.updateTimerCueState();
  };

  private hitHazard: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_player, hazard) => {
    const sprite = hazard as Phaser.Physics.Arcade.Sprite;
    if (!sprite.active || this.reachedGoal) {
      return;
    }
    sprite.disableBody(true, true);
    this.handleGameOver('ATINGIDO!');
  };

  update(): void {
    if (this.reachedGoal) {
      return;
    }

    this.loopHazards();
    this.animateFruits();
    this.updateBackgroundParallax();
    this.checkGoal();
    this.checkFall();
  }

  private updateBackgroundParallax(): void {
    const scrollY = this.cameras.main.scrollY;
    this.backdrop.tilePositionY = scrollY * 0.3;
  }

  private loopHazards(): void {
    this.hazards.children.each((child) => {
      const hazard = child as Phaser.Physics.Arcade.Sprite;
      if (!hazard.active) {
        return true;
      }
      const type = hazard.getData('type') as string | undefined;
      if (type === 'vertical') {
        const cameraBottom = this.cameras.main.scrollY + this.scale.height + 40;
        if (hazard.y > cameraBottom || hazard.y > this.levelHeight - 16) {
          hazard.disableBody(true, true);
        }
        return true;
      }

      const fromLeft = hazard.getData('fromLeft');
      if (fromLeft && hazard.x > this.scale.width + 32) {
        hazard.disableBody(true, true);
      } else if (!fromLeft && hazard.x < -32) {
        hazard.disableBody(true, true);
      }
      return true;
    });
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
      const bonus = Math.max(this.timeLeft * 50, 0);
      this.score += bonus;
      this.addFloatingText(this.player.x, this.player.y - 40, 'VITÓRIA!');
      if (bonus > 0) {
        this.addFloatingText(this.player.x, this.player.y - 58, `BONUS ${bonus}`);
      }
      this.stageText.setStyle({ color: '#aef78d' });
      const currentLabel = this.currentStage.toString().padStart(2, '0');
      const nextLabel = (this.currentStage + 1).toString().padStart(2, '0');
      this.stageText.setText(`FASE ${currentLabel} COMPLETA! PROXIMA ${nextLabel}`);
      this.updateHUD();
      this.updateTimerCueState();
      this.playOutcomeJingle('victory');
      this.time.delayedCall(1600, () => {
        this.scene.start('score', {
          outcome: 'victory',
          stage: this.currentStage,
          score: this.score,
          nextStage: this.currentStage + 1
        });
      });
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
    this.stageText.setText(`FIM DE JOGO: ${reason}`);
    this.stageText.setStyle({ color: '#ff4f4f' });
    this.addFloatingText(this.player.x, this.player.y - 30, reason);
    this.updateTimerCueState();
    this.playOutcomeJingle('gameover');
    this.time.delayedCall(1400, () => {
      this.scene.start('score', {
        outcome: 'gameover',
        stage: this.currentStage,
        score: this.score
      });
    });
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

  private setupAudio(): void {
    this.stopAudio();
    this.themeMusic = this.sound.add('music-theme', { loop: true, volume: 0.25 });
    this.timerCue = this.sound.add('music-timer', { loop: true, volume: 0.25 });
    this.victoryJingle = this.sound.add('music-victory', { loop: false, volume: 0.4 });
    this.gameOverJingle = this.sound.add('music-gameover', { loop: false, volume: 0.4 });
    this.themeMusic.play();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopAudio());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.stopAudio());
  }

  private stopAudio(): void {
    this.themeMusic?.stop();
    this.timerCue?.stop();
    this.victoryJingle?.stop();
    this.gameOverJingle?.stop();
    this.timerCuePlaying = false;
  }

  private updateTimerCueState(): void {
    if (!this.timerCue) {
      return;
    }
    if (this.reachedGoal || this.timeLeft <= 0) {
      if (this.timerCuePlaying) {
        this.timerCue.stop();
        this.timerCuePlaying = false;
      }
      return;
    }

    if (this.timeLeft <= 20) {
      if (!this.timerCuePlaying) {
        this.timerCue.play();
        this.timerCuePlaying = true;
      }
    } else if (this.timerCuePlaying) {
      this.timerCue.stop();
      this.timerCuePlaying = false;
    }
  }

  private playOutcomeJingle(outcome: 'victory' | 'gameover'): void {
    this.timerCue?.stop();
    this.timerCuePlaying = false;
    this.themeMusic?.stop();
    if (outcome === 'victory') {
      this.victoryJingle?.stop();
      this.victoryJingle?.play();
    } else {
      this.gameOverJingle?.stop();
      this.gameOverJingle?.play();
    }
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
