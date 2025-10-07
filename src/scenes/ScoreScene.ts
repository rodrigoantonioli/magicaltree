import Phaser from 'phaser';
import gameState from '../state/GameState';

interface ScoreData {
  score?: number;
  stage?: number;
}

export default class ScoreScene extends Phaser.Scene {
  private playerName = '';

  private nameText!: Phaser.GameObjects.Text;

  private infoText!: Phaser.GameObjects.Text;

  private rankingText!: Phaser.GameObjects.Text;

  private submitted = false;

  private finalScore = 0;

  private stageReached = 1;

  constructor() {
    super('score');
  }

  init(data: ScoreData): void {
    this.finalScore = data.score ?? gameState.getScore();
    gameState.setScore(this.finalScore);
    const reportedStage = data.stage ?? gameState.getStage();
    this.stageReached = Math.max(1, reportedStage);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#06111d');
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.tileSprite(centerX, centerY, this.scale.width, this.scale.height, 'sky').setAlpha(0.25);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#ffe082',
      stroke: '#2b1300',
      strokeThickness: 4
    };

    const infoStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#0a1930',
      strokeThickness: 3
    };

    this.add.text(centerX, 48, 'PLACAR FINAL', titleStyle).setOrigin(0.5, 0.5);
    this.add
      .text(centerX, 88, `PONTOS ${this.finalScore.toString().padStart(7, '0')}`, infoStyle)
      .setOrigin(0.5, 0.5);
    this.add
      .text(centerX, 116, `FASE ALCANÇADA ${this.stageReached.toString().padStart(2, '0')}`, infoStyle)
      .setOrigin(0.5, 0.5);

    this.nameText = this.add
      .text(centerX, 150, 'NOME: ________', infoStyle)
      .setOrigin(0.5, 0.5);
    this.infoText = this.add
      .text(centerX, 184, 'DIGITE SEU NOME E PRESSIONE ENTER', infoStyle)
      .setOrigin(0.5, 0.5);

    this.rankingText = this.add
      .text(12, 12, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#ffffff',
        stroke: '#001428',
        strokeThickness: 3
      })
      .setOrigin(0, 0)
      .setAlpha(0.85);

    this.updateRanking();
    this.updateNameText();

    const handleKey = (event: KeyboardEvent) => {
      if (this.submitted) {
        if (event.code === 'Space' || event.code === 'Enter') {
          this.returnToTitle();
        }
        return;
      }

      if (event.code === 'Backspace') {
        event.preventDefault();
        this.playerName = this.playerName.slice(0, -1);
        this.updateNameText();
        return;
      }

      if (event.code === 'Enter') {
        event.preventDefault();
        this.submitScore();
        return;
      }

      if (this.playerName.length >= 8) {
        return;
      }

      if (event.key.length === 1) {
        this.playerName += event.key;
        this.updateNameText();
      }
    };

    this.input.keyboard.on('keydown', handleKey);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off('keydown', handleKey);
    });
  }

  private updateNameText(): void {
    const display = (this.playerName || '').padEnd(8, '_').slice(0, 8);
    this.nameText.setText(`NOME: ${display}`);
  }

  private updateRanking(): void {
    const entries = gameState.getHighScores();
    if (entries.length === 0) {
      this.rankingText.setText('MELHORES\nSEM REGISTROS');
      return;
    }

    const lines = entries
      .map((entry, index) => {
        const rank = (index + 1).toString().padStart(2, '0');
        const name = entry.name.padEnd(8, ' ');
        const points = entry.score.toString().padStart(7, '0');
        return `${rank} ${name} ${points}`;
      })
      .join('\n');
    this.rankingText.setText(`MELHORES\n${lines}`);
  }

  private submitScore(): void {
    this.submitted = true;
    gameState.setStage(this.stageReached);
    gameState.submitScore(this.playerName);
    this.updateRanking();
    this.infoText.setText('PONTUAÇÃO REGISTRADA! ENTER/ESPAÇO PARA TÍTULO');
  }

  private returnToTitle(): void {
    gameState.resetProgress();
    this.scene.start('title');
  }
}
