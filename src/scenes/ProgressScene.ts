import Phaser from 'phaser';
import gameState from '../state/GameState';

export type ProgressMode = 'stage-clear' | 'life-lost';

export interface ProgressData {
  mode: ProgressMode;
  stage: number;
  bonus?: number;
  timeLeft?: number;
  reason?: string;
  lives?: number;
  continues?: number;
  score?: number;
}

export default class ProgressScene extends Phaser.Scene {
  private continueTimer?: Phaser.Time.TimerEvent;

  private countdownValue = 9;

  private countdownText?: Phaser.GameObjects.Text;

  private awaitingContinue = false;

  private continueStage = 1;

  constructor() {
    super('progress');
  }

  create(data: ProgressData): void {
    this.cameras.main.setBackgroundColor('#06111d');
    const background = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.35);
    background.setOrigin(0, 0);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.continueTimer?.remove(false);
      this.input.keyboard.off('keydown', this.handleContinueInput, this);
    });

    gameState.setScore(data.score ?? gameState.getScore());

    if (data.mode === 'stage-clear') {
      this.handleStageClear(data);
    } else {
      this.handleLifeLost(data);
    }
  }

  private handleStageClear(data: ProgressData): void {
    const stageLabel = data.stage.toString().padStart(2, '0');
    const centerX = this.scale.width / 2;
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#aef78d',
      align: 'center',
      stroke: '#1a3d12',
      strokeThickness: 4
    };

    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      stroke: '#0a1930',
      strokeThickness: 3
    };

    this.add.text(centerX, 48, `FASE ${stageLabel} COMPLETA`, titleStyle).setOrigin(0.5, 0.5);

    const baseScore = data.score ?? gameState.getScore();
    gameState.setScore(baseScore);

    const timeLeft = Math.max(0, Math.floor(data.timeLeft ?? 0));
    const bonusPerTick = 50;
    const totalBonus = Math.max(0, Math.floor(data.bonus ?? timeLeft * bonusPerTick));

    const timeText = this.add
      .text(centerX, 104, `TEMPO RESTANTE ${timeLeft.toString().padStart(3, '0')}`, infoStyle)
      .setOrigin(0.5, 0.5);
    const bonusText = this.add
      .text(centerX, 144, `BÔNUS DE TEMPO 00000`, infoStyle)
      .setOrigin(0.5, 0.5);
    const totalText = this.add
      .text(centerX, 188, `TOTAL ${baseScore.toString().padStart(7, '0')}`, infoStyle)
      .setOrigin(0.5, 0.5);

    if (totalBonus <= 0 || timeLeft <= 0) {
      bonusText.setText('BÔNUS DE TEMPO 00000');
      this.scheduleNextStage(data.stage);
      return;
    }

    let remaining = timeLeft;
    let accumulated = 0;

    const event = this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        if (remaining <= 0) {
          event.remove(false);
          this.scheduleNextStage(data.stage);
          return;
        }
        remaining -= 1;
        accumulated += bonusPerTick;
        timeText.setText(`TEMPO RESTANTE ${remaining.toString().padStart(3, '0')}`);
        bonusText.setText(`BÔNUS DE TEMPO ${accumulated.toString().padStart(5, '0')}`);
        totalText.setText(`TOTAL ${gameState.addScore(bonusPerTick).toString().padStart(7, '0')}`);
        if (remaining <= 0) {
          event.remove(false);
          this.scheduleNextStage(data.stage);
        }
      }
    });
  }

  private scheduleNextStage(stage: number): void {
    gameState.recordStageClear(stage + 1);
    const nextStage = gameState.getStage();
    this.time.delayedCall(1200, () => {
      this.scene.start('intro', {
        stage: nextStage,
        skipSelection: true,
        message: 'PRÓXIMA FASE'
      });
    });
  }

  private handleLifeLost(data: ProgressData): void {
    const stageLabel = data.stage.toString().padStart(2, '0');
    const centerX = this.scale.width / 2;
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff8a80',
      align: 'center',
      stroke: '#330000',
      strokeThickness: 4
    };
    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      stroke: '#0a1930',
      strokeThickness: 3
    };

    this.add
      .text(centerX, 48, `FASE ${stageLabel}`, titleStyle)
      .setOrigin(0.5, 0.5);
    this.add
      .text(centerX, 90, data.reason ? data.reason.toUpperCase() : 'VIDA PERDIDA', infoStyle)
      .setOrigin(0.5, 0.5);

    const livesLeft = data.lives ?? gameState.getLives();
    const continuesLeft = data.continues ?? gameState.getContinues();
    gameState.setStage(data.stage);

    if (livesLeft > 0) {
      this.add
        .text(centerX, 140, `VIDAS RESTANTES ${livesLeft.toString().padStart(2, '0')}`, infoStyle)
        .setOrigin(0.5, 0.5);
      this.time.delayedCall(1600, () => {
        this.scene.start('intro', {
          stage: data.stage,
          skipSelection: true,
          message: 'TENTE NOVAMENTE'
        });
      });
      return;
    }

    if (continuesLeft > 0) {
      this.awaitingContinue = true;
      this.countdownValue = 9;
      this.countdownText = this.add
        .text(centerX, 150, `CONTINUE? ${this.countdownValue}`, infoStyle)
        .setOrigin(0.5, 0.5);
      this.add
        .text(centerX, 186, 'APERTE ESPAÇO OU ENTER', infoStyle)
        .setOrigin(0.5, 0.5);
      this.startContinueCountdown(data.stage);
      return;
    }

    this.add
      .text(centerX, 150, 'FIM DE JOGO', infoStyle)
      .setOrigin(0.5, 0.5);
    this.time.delayedCall(1600, () => {
      this.scene.start('score', {
        stage: data.stage,
        score: gameState.getScore()
      });
    });
  }

  private startContinueCountdown(stage: number): void {
    this.continueStage = stage;
    this.input.keyboard.on('keydown', this.handleContinueInput, this);
    this.continueTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.awaitingContinue) {
          return;
        }
        this.countdownValue -= 1;
        if (this.countdownText) {
          this.countdownText.setText(`CONTINUE? ${Math.max(0, this.countdownValue)}`);
        }
        if (this.countdownValue < 0) {
          this.finishWithoutContinue();
        }
      }
    });
  }

  private handleContinueInput(event: KeyboardEvent): void {
    if (!this.awaitingContinue) {
      return;
    }
    if (event.code !== 'Space' && event.code !== 'Enter') {
      return;
    }
    event.preventDefault();
    const resumed = gameState.tryContinue();
    if (!resumed) {
      return;
    }
    this.awaitingContinue = false;
    this.countdownText?.setText('VAMOS CONTINUAR!');
    this.continueTimer?.remove(false);
    this.time.delayedCall(800, () => {
      this.scene.start('intro', {
        stage: this.continueStage,
        skipSelection: true,
        message: 'CONTINUE'
      });
    });
  }

  private finishWithoutContinue(): void {
    if (!this.awaitingContinue) {
      return;
    }
    this.awaitingContinue = false;
    this.continueTimer?.remove(false);
    this.countdownText?.setText('FIM DE JOGO');
    this.time.delayedCall(1000, () => {
      this.scene.start('score', {
        stage: this.continueStage,
        score: gameState.getScore()
      });
    });
  }

}
