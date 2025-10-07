import Phaser from 'phaser';
import Player from '../objects/Player';
import {
  StageDefinition,
  StageHazardEvent,
  StageItemConfig,
  LadderConfig,
  getStageDefinition,
  getStageLabel
} from '../data/levels';

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

  private sky!: Phaser.GameObjects.TileSprite;

  private scoreText!: Phaser.GameObjects.Text;

  private timeText!: Phaser.GameObjects.Text;

  private stageDefinition!: StageDefinition;

  private goalMarker!: Phaser.GameObjects.Image;

  private readonly hazardTelegraphDuration = 360;

  constructor() {
    super('game');
  }

  init(data: { stage?: number; score?: number } = {}): void {
    const requestedStage = data.stage ?? 1;
    this.stageDefinition = getStageDefinition(requestedStage);
    this.currentStage = this.stageDefinition.id;
    this.score = data.score ?? 0;
    this.timeLeft = this.stageDefinition.timeLimit;
    this.reachedGoal = false;
    this.levelHeight = this.stageDefinition.levelHeight;
  }

  create(): void {
    this.createWorld();
    this.createTree();
    this.createStageDecorations();
    this.createBranchesAndFruits();
    this.createPlayer();
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

    if (this.stageDefinition.finale) {
      const finale = this.stageDefinition.finale;
      const canopy = this.add.tileSprite(128, finale.canopyY, 256, finale.canopyHeight, 'canopy');
      canopy.setOrigin(0.5, 1);
      canopy.setDepth(2);
    }

    const goalY = this.stageDefinition.goalHeight;
    this.goalMarker = this.add.image(128, goalY, 'goal-banner');
    this.goalMarker.setOrigin(0.5, 1);
    this.goalMarker.setDepth(6);

    const climbWidth = this.stageDefinition.climbZoneWidth ?? 48;
    this.climbZone = this.add.zone(128, this.levelHeight / 2, climbWidth, this.levelHeight);
    this.physics.add.existing(this.climbZone, true);
  }

  private createStageDecorations(): void {
    this.createLadders(this.stageDefinition.ladders);
    if (this.stageDefinition.finale?.stairs) {
      this.createLadders(this.stageDefinition.finale.stairs);
    }
    this.createCheckpoints();
  }

  private createLadders(configs?: LadderConfig[]): void {
    if (!configs || configs.length === 0) {
      return;
    }
    configs.forEach((config) => {
      const height = config.bottom - config.top;
      if (height <= 0) {
        return;
      }
      const ladder = this.add.tileSprite(config.x, config.bottom, config.width ?? 24, height, 'ladder');
      ladder.setOrigin(0.5, 1);
      ladder.setDepth(3);
    });
  }

  private createCheckpoints(): void {
    const checkpoints = this.stageDefinition.checkpoints ?? [];
    if (checkpoints.length === 0) {
      return;
    }
    checkpoints.forEach((checkpoint) => {
      const marker = this.add.image(228, checkpoint.y, 'checkpoint');
      marker.setOrigin(0.5, 0.5);
      marker.setDepth(5);
      if (checkpoint.label) {
        const text = this.add
          .text(228, checkpoint.y - 14, checkpoint.label, {
            fontSize: '8px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#ffe082',
            stroke: '#401000',
            strokeThickness: 2,
            align: 'center'
          })
          .setOrigin(0.5, 0.5);
        text.setDepth(5);
      }
    });
  }

  private createBranchesAndFruits(): void {
    this.branches = this.physics.add.staticGroup();
    this.fruits = this.physics.add.group({ allowGravity: false, immovable: true });

    const layout = this.stageDefinition.layout;
    let fruitIndex = 0;

    layout.forEach((config) => {
      const branch = this.branches.create(config.x, config.y, 'branch') as Phaser.Physics.Arcade.Sprite;
      branch.setOrigin(0.5, 0.5);
      branch.refreshBody();

      if (config.fruit) {
        const texture = config.fruit.texture ?? 'fruit';
        const offsetY = config.fruit.offsetY ?? 20;
        const fruit = this.fruits.create(config.x, config.y - offsetY, texture) as Phaser.Physics.Arcade.Sprite;
        fruit.setData('value', config.fruit.value);
        fruit.setData('timeBonus', config.fruit.timeBonus ?? this.stageDefinition.fruitTimeBonus);
        fruit.setData('floatingSeed', fruitIndex * 133 + 31);
        fruitIndex += 1;
      }
    });

    (this.stageDefinition.items ?? []).forEach((item: StageItemConfig) => {
      const texture = item.texture ?? 'fruit';
      const fruit = this.fruits.create(item.x, item.y, texture) as Phaser.Physics.Arcade.Sprite;
      fruit.setData('value', item.value);
      fruit.setData('timeBonus', item.timeBonus ?? this.stageDefinition.fruitTimeBonus);
      fruit.setData('floatingSeed', fruitIndex * 133 + 31);
      fruitIndex += 1;
    });
  }

  private createPlayer(): void {
    const startX = this.stageDefinition.playerStart.x;
    const startY = this.stageDefinition.playerStart.y;
    this.player = new Player(this, startX, startY);
    this.player.setClimbZone(this.climbZone);

    this.player.setDepth(10);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.15, 0, 20);
    this.cameras.main.setScroll(0, this.levelHeight - this.scale.height);
  }

  private createHazards(): void {
    this.hazards = this.physics.add.group();

    this.stageDefinition.hazardEvents.forEach((event) => {
      this.time.delayedCall(event.at, () => this.spawnHazardEvent(event));
    });
  }

  private spawnHazardEvent(event: StageHazardEvent): void {
    if (this.reachedGoal) {
      return;
    }
    if (event.type === 'horizontal') {
      const fromLeft = event.fromLeft ?? true;
      const spawnX = fromLeft ? -32 : this.scale.width + 32;
      const minY = this.stageDefinition.goalHeight + 80;
      const maxY = this.levelHeight - 200;
      const baseY = this.stageDefinition.goalHeight + 200;
      const targetY = Phaser.Math.Clamp(event.y ?? baseY, minY, maxY);
      const hazard = this.hazards.create(spawnX, targetY, 'hazard') as Phaser.Physics.Arcade.Sprite;
      hazard.setActive(true).setVisible(true);
      hazard.setCircle(10);
      hazard.setDepth(8);
      hazard.setCollideWorldBounds(false);
      hazard.setVelocity(0, 0);
      hazard.setAlpha(0.3);
      const warning = this.add.image(fromLeft ? 8 : this.scale.width - 8, targetY, fromLeft ? 'warning-right' : 'warning-left');
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
        hazard.setVelocityX((fromLeft ? 1 : -1) * (event.speed ?? this.stageDefinition.hazardDefaults.horizontalSpeed));
        hazard.setVelocityY(0);
      });
      hazard.setData('fromLeft', fromLeft);
      hazard.setData('type', 'horizontal');
      return;
    }

    const spawnX = event.x ?? 128;
    const spawnY = Phaser.Math.Clamp(event.y ?? this.stageDefinition.goalHeight - 140, 40, this.levelHeight - 120);
    const hazard = this.hazards.create(spawnX, spawnY, 'coconut') as Phaser.Physics.Arcade.Sprite;
    hazard.setActive(true).setVisible(true);
    hazard.setCircle(6);
    hazard.setVelocity(0, 0);
    hazard.setGravityY(0);
    hazard.setAlpha(0.2);
    const warning = this.add.image(spawnX, spawnY + 40, 'warning-down');
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
      hazard.setGravityY(event.gravity ?? this.stageDefinition.hazardDefaults.fallingGravity);
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

    const stageLabel = this.stageDefinition.label;
    this.scoreText = this.add.text(8, 8, '', style).setOrigin(0, 0).setScrollFactor(0);
    this.timeText = this.add.text(this.scale.width - 8, 8, '', style).setOrigin(1, 0).setScrollFactor(0);
    this.stageText = this.add
      .text(this.scale.width / 2, this.scale.height - 10, `${stageLabel} - ${this.stageDefinition.intro}`, style)
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
    this.addFloatingText(sprite.x, sprite.y, `+${value}`);
    this.score += value;
    const timeBonus = sprite.getData('timeBonus') ?? this.stageDefinition.fruitTimeBonus;
    if (timeBonus > 0) {
      this.timeLeft = Math.min(this.timeLeft + timeBonus, this.stageDefinition.maxTime);
      this.addFloatingText(sprite.x, sprite.y - 16, `+${timeBonus} TEMPO`);
    }
    this.updateHUD();
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
    this.sky.tilePositionY = scrollY * 0.2;
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
    if (this.player.y < this.stageDefinition.goalHeight && !this.reachedGoal) {
      this.reachedGoal = true;
      this.score += Math.max(this.timeLeft * 50, 0);
      this.addFloatingText(this.player.x, this.player.y - 40, 'VITÓRIA!');
      this.updateHUD();
      const stageLabel = this.stageDefinition.label;
      if (this.stageDefinition.isFinal) {
        this.stageText.setText(`${stageLabel} COMPLETA! COPA ALCANÇADA!`);
        this.stageText.setStyle({ color: '#aef78d' });
        this.time.delayedCall(1200, () => {
          this.scene.start('victory', { score: this.score });
        });
        return;
      }

      const nextStageId = this.stageDefinition.nextStage ?? this.currentStage + 1;
      const nextLabel = getStageLabel(nextStageId);
      this.time.delayedCall(1200, () => {
        this.scene.restart({ stage: nextStageId, score: this.score });
      });
      this.stageText.setText(`${stageLabel} COMPLETA! PRÓXIMA ${nextLabel}`);
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

}
